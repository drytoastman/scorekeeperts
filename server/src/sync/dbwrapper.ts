import fs from 'fs'
import { db, pgp, ScorekeeperProtocol } from '@/db'
import { MergeServer } from '@/db/mergeserverrepo'
import { synclog } from '@/util/logging'
import { MergeServerEntry } from './mergeserver'
import { LOCAL_TIMEOUT, REMOTE_TIMEOUT } from './constants'

const dbmap = new Map<any, ScorekeeperProtocol>()

export class SyncError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'SyncError'
    }
}


export function getRemoteDB(remote: MergeServer, series: string, password: string): ScorekeeperProtocol {
    const cn = {
        host: remote.address || remote.hostname,
        port: 54239,
        database: 'scorekeeper',
        user: series,
        password: password,
        application_name: 'syncremote',
        ssl: {
            ca: fs.readFileSync('/certs/root.crt').toString(),
            key: fs.readFileSync('/certs/server.cert').toString(),
            cert: fs.readFileSync('/certs/server.cert').toString(),
            rejectUnauthorized: true
            // checkServerIdentity ?
        }
    }

    if (!dbmap.has(cn)) {
        dbmap.set(cn, pgp(cn))
    }

    return dbmap.get(cn) as ScorekeeperProtocol
}


export async function executeSync(localserver: MergeServerEntry, remoteserver: MergeServerEntry, series: string, password: string,
    execution: (wrap: WrappedDatabaseInfo) => Promise<void>) {
    await db.tx(async localtx => {
        await getRemoteDB(remoteserver, series, password).tx(async remotetx => {
            const wrap = new WrappedDatabaseInfo(localtx, localserver, remotetx, remoteserver, series)
            await wrap.setTimeouts()
            try {
                await wrap.getLocks()
                await execution(wrap)
            } finally {
                await wrap.returnLocks()
            }
        })
    })
}

async function asyncwait(ms: number) {
    return new Promise(resolve => { setTimeout(resolve, ms) })
}

export class WrappedDatabaseInfo {
    series: string
    lock1: ScorekeeperProtocol|undefined
    lock2: ScorekeeperProtocol|undefined

    constructor(private localdb: ScorekeeperProtocol, private localserver: MergeServerEntry,
                private remotedb: ScorekeeperProtocol, private remoteserver: MergeServerEntry,
                series: string) {
        this.series = series
    }

    async setTimeouts() {
        await this.localdb.none('SET idle_in_transaction_session_timeout=$1', [LOCAL_TIMEOUT * 1000])
        await this.remotedb.none('SET idle_in_transaction_session_timeout=$1', [REMOTE_TIMEOUT * 1000])
    }

    async getLocks() {
        /*
            Context manager to acquire/release advisory locks on both servers.
            It will throw assertion error if it can't get both.  The logic for
            first lock to obtain is there to help dynamic merging systems in
            obtaining locks in the same order to reduce distributed lock race
            conditions.  The current order is lower serverid first.
            Also sets the series schema path so its all nicely tied away here.
        */
        let tries = 10
        let cur1  = this.localdb
        let cur2  = this.remotedb

        if (this.localserver.serverid >= this.remoteserver.serverid) {
            cur1 = this.remotedb
            cur2 = this.localdb
        }

        await Promise.all([cur1.series.setSeries(this.series), cur2.series.setSeries(this.series)])

        while (tries > 0) {
            if ((await cur1.one('SELECT pg_try_advisory_lock(42) as lock')).lock) {
                this.lock1 = cur1
                if ((await cur2.one('SELECT pg_try_advisory_lock(42)')).lock) {
                    this.lock2 = cur2
                    synclog.debug('Acquired both locks')
                    return
                }
            }

            // Failed on lock1 or lock2, release the lock we did get, wait and retry
            synclog.debug('Unable to obtain locks, sleeping and trying again')
            if (this.lock1) { await this.lock1.one('SELECT pg_advisory_unlock(42)') }
            await asyncwait(1000)
            tries -= 1
        }

        throw new SyncError('Unable to obtain locks, will try again later')
    }

    async returnLocks() {
        // needed coming from psycopg to make sure it was clear, FINISH ME, check here now
        await this.remotedb.none('ROLLBACK').catch(error => { synclog.error(error) })
        await this.localdb.none('ROLLBACK').catch(error => { synclog.error(error) })

        synclog.debug('Releasing locks')
        // Release locks in opposite order from obtaining to avoid deadlock
        if (this.lock2) {
            await this.lock2.one('SELECT pg_advisory_unlock(42)').catch(error => synclog.error(error))
        }
        if (this.lock1) {
            await this.lock1.one('SELECT pg_advisory_unlock(42)').catch(error => synclog.error(error))
        }
    }
}
