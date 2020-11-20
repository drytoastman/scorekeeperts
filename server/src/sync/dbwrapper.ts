import _ from 'lodash'
import fs from 'fs'
import { db, pgp, ScorekeeperProtocol } from '@/db'
import { MergeServer } from '@/db/mergeserverrepo'
import { synclog } from '@/util/logging'
import { MergeServerEntry } from './mergeserver'
import { LOCAL_TIMEOUT, logtablefor, PRIMARY_KEYS, REMOTE_TIMEOUT } from './constants'
import { formatToTimestamp, parseTimestamp } from '@/common/util'

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


export async function performSyncWrap(localserver: MergeServerEntry, remoteserver: MergeServerEntry, series: string,
    execution: (wrap: SyncProcessInfo) => Promise<void>) {
    await db.task(async localtask => {
        const password = await localtask.merge.loadPassword(series)
        const version  = await localtask.general.getSchemaVersion()

        if (!password) {
            remoteserver.seriesDone(series, `No password for ${series}, skipping`)
            return
        }

        await getRemoteDB(remoteserver, series, password).task(async remotetask => {
            const wrap = new SyncProcessInfo(localtask, localserver, version, remotetask, remoteserver, series)
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

export class WrappedSyncInfo {
    myserver:     MergeServerEntry
    remoteserver: MergeServerEntry
    version:      string
    constructor() { /* */
    }
}

export class SyncProcessInfo {
    lock1: ScorekeeperProtocol|undefined
    lock2: ScorekeeperProtocol|undefined

    constructor(private localtask: ScorekeeperProtocol,   private localserver: MergeServerEntry, private version: string,
               private remotetask: ScorekeeperProtocol,  private remoteserver: MergeServerEntry, private series: string) {
    }

    async updateRemoteCache() {
        return this.remoteserver.updateCacheFrom(this.remotetask, this.version, this.series)
    }

    async updateLocalCache() {
        return this.localserver.updateCacheFrom(this.localtask, this.version, this.series)
    }

    async remoteStatus(status: string) {
        this.remoteserver.seriesStatus(this.series, 'Commit Changes')
    }

    clearRemoteError() {
        delete this.remoteserver.mergestate[this.series].error
    }

    seriesHashDiffers() {
        return this.remoteserver.mergestate[this.series].totalhash !== this.localserver.mergestate[this.series].totalhash
    }

    differingTables(): string[] {
        const ltables = this.localserver.mergestate[this.series].hashes
        const rtables = this.remoteserver.mergestate[this.series].hashes
        if (!ltables || !rtables) {
            throw Error('Unable to find tables hash status')
        }
        return [...new Set([...Object.keys(ltables), ...Object.keys(rtables)].filter(table => ltables[table] !== rtables[table]))]
    }

    async loadLocalPresent(table: string) { return this.loadPresent(this.localtask, table) }
    async loadRemotePresent(table: string) { return this.loadPresent(this.remotetask, table) }
    private async loadPresent(task: ScorekeeperProtocol, table: string) {
        const ret = new Map()
        for (const row of await task.any('SELECT * FROM $1:sql', [table])) {
            row.modmsutc = parseTimestamp(row.modified).getTime()
            ret.set(_.pick(row, PRIMARY_KEYS[table]), row)
        }
        return ret
    }

    async loadLocalDeletedSince(table: string, when: Date) { return this.deletedSince(this.localtask, table, when) }
    async loadRemoteDeletedSince(table: string, when: Date) { return this.deletedSince(this.localtask, table, when) }
    private async deletedSince(task: ScorekeeperProtocol, table: string, when: Date) {
        const ret = new Map()
        for (const row of await task.any("SELECT otime, olddata FROM $1:sql WHERE action='D' AND tablen=$2 AND otime>$3", [logtablefor(table), table, when])) {
            const pk = _.pick(row.olddata, PRIMARY_KEYS[table])
            ret.set(pk, { data: row.olddata, otime: row.otime })
        }
        return ret
    }


    async setTimeouts() {
        await this.localtask.none('SET idle_in_transaction_session_timeout=$1', [LOCAL_TIMEOUT * 1000])
        await this.remotetask.none('SET idle_in_transaction_session_timeout=$1', [REMOTE_TIMEOUT * 1000])
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
        let cur1  = this.localtask
        let cur2  = this.remotetask

        if (this.localserver.serverid >= this.remoteserver.serverid) {
            cur1 = this.remotetask
            cur2 = this.localtask
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
        await this.remotetask.none('ROLLBACK').catch(error => { synclog.error(error) })
        await this.localtask.none('ROLLBACK').catch(error => { synclog.error(error) })

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
