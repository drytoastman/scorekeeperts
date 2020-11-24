/* eslint-disable lines-between-class-members */
import _ from 'lodash'
import fs from 'fs'
import util from 'util'

import { pgp, ScorekeeperProtocol, SYNCTABLES } from '@/db'
import { MergeServer } from '@/db/mergeserverrepo'
import { synclog } from '@/util/logging'
import { MergeServerEntry } from './mergeserver'
import { asyncwait, LOCAL_TIMEOUT, logtablefor, PRIMARY_SETS, REMOTE_TIMEOUT } from './constants'
import { parseTimestamp } from '@/common/util'
import { DBObject, DeletedObject, getPKHash, LoggedObject, PrimaryKey, PrimaryKeyHash } from './types'

const dbmap = new Map<string, ScorekeeperProtocol>()

export class SyncError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'SyncError'
    }
}


export function getRemoteDB(remote: MergeServer, series: string, password: string): ScorekeeperProtocol {
    let address = remote.address
    let port    = 54329

    if (address && address.indexOf(':') > 0) {
        const parts = remote.address.split(':')
        address = parts[0]
        port    = parseInt(parts[1])
    }

    const cn = {
        host: address || remote.hostname,
        port: port,
        database: 'scorekeeper',
        user: series,
        password: password,
        application_name: 'syncremote'
    } as any

    if (port === 54329) {
        cn.ssl =  {
            ca: fs.readFileSync('/certs/root.cert').toString(),
            key: fs.readFileSync('/certs/server.key').toString(),
            cert: fs.readFileSync('/certs/server.cert').toString(),
            rejectUnauthorized: true
            // checkServerIdentity ?
        }
    }

    const key = [cn.host, cn.port, cn.user, cn.password].join(';')
    if (!dbmap.has(key)) {
        dbmap.set(key, pgp(cn))
    }
    return dbmap.get(key) as ScorekeeperProtocol
}


export async function performSyncWrap(roottask: ScorekeeperProtocol, localserver: MergeServerEntry, remoteserver: MergeServerEntry, series: string,
    execution: (wrap: SyncProcessInfo) => Promise<void>) {
    const password = await roottask.merge.loadPassword(series)
    const version  = await roottask.general.getSchemaVersion()

    if (!password) {
        remoteserver.seriesDone(series, `No password for ${series}, skipping`)
        return
    }

    await getRemoteDB(remoteserver, series, password).task(async remotetask => {
        const wrap = new SyncProcessInfo(roottask, localserver, version, remotetask, remoteserver, series)
        await wrap.setTimeouts()
        try {
            await wrap.getLocks()
            await execution(wrap)
        } finally {
            await wrap.returnLocks()
        }
    })
}

export class SyncProcessInfo {
    lock1: ScorekeeperProtocol|undefined
    lock2: ScorekeeperProtocol|undefined

    constructor(private localtask: ScorekeeperProtocol,   private localserver: MergeServerEntry, private version: string,
               private remotetask: ScorekeeperProtocol,  private remoteserver: MergeServerEntry, private series: string) {
    }

    async updateRemoteCache() {
        return this.remoteserver.updateCacheFrom(this.remotetask, this.series, this.version)
    }

    async updateLocalCache() {
        return this.localserver.updateCacheFrom(this.localtask, this.series, this.version)
    }

    async remoteStatus(status: string) {
        synclog.debug(status)
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

    async loadAll(table: string)  {
        return Promise.all([
            this.load(this.localtask, table),
            this.load(this.remotetask, table)
        ])
    }
    private async load(task: ScorekeeperProtocol, table: string) {
        const ret = new Map<PrimaryKeyHash, DBObject>()
        for (const row of await task.any('SELECT * FROM $1:raw', [table])) {
            ret.set(getPKHash(table, row), row)
        }
        return ret
    }

    async loggedLocal(loggedobj,  pkset, table, when) { return this.logged(this.localtask, loggedobj, pkset, table, when) }
    async loggedRemote(loggedobj, pkset, table, when) { return this.logged(this.remotetask, loggedobj, pkset, table, when) }
    async logged(task: ScorekeeperProtocol, loggedobj: DBObject, pkset: Set<any>, table: string, when: Date) {
        return new Map<PrimaryKey, LoggedObject>()
    }

    async deletedSince(table: string, localwhen: Date, remotewhen: Date)  {
        return Promise.all([
            this.deleted(this.localtask, table, localwhen),
            this.deleted(this.remotetask, table, remotewhen)
        ])
    }
    private async deleted(task: ScorekeeperProtocol, table: string, when: Date) {
        const ret = new Map<PrimaryKeyHash, DeletedObject>()
        for (const row of await task.any("SELECT otime, olddata FROM $1:raw WHERE action='D' AND tablen=$2 AND otime>$3", [logtablefor(table), table, when])) {
            ret.set(getPKHash(table, row.olddata), { data: row.olddata, otime: parseTimestamp(row.otime) })
        }
        return ret
    }


    async insertAll(table: string, localobjs: DBObject[], remoteobjs: DBObject[])  {
        return Promise.all([
            this.insert(this.localtask, table, localobjs),
            this.insert(this.remotetask, table, remoteobjs)
        ])
    }
    private async insert(task: ScorekeeperProtocol, table: string, objs: DBObject[]) {
        if (objs.length) {
            await task.any(pgp.helpers.insert(objs, SYNCTABLES[table]))
        }
        return true
    }


    async updateAll(table: string, localobjs: DBObject[], remoteobjs: DBObject[])  {
        return Promise.all([
            this.update(this.localtask, table, localobjs),
            this.update(this.remotetask, table, remoteobjs)
        ])
    }
    private async update(task: ScorekeeperProtocol, table: string, objs: DBObject[]) {
        if (objs.length) {
            await task.none(pgp.helpers.update(objs, SYNCTABLES[table]))
        }
        return true
    }


    async deleteAll(table: string, localobjs: DeletedObject[], remoteobjs: DeletedObject[]) {
        return Promise.all([
            this.delete(this.localtask, table, localobjs.map(o => o.data)),
            this.delete(this.remotetask, table, remoteobjs.map(o => o.data))
        ])
    }
    private async delete(task: ScorekeeperProtocol, table: string, objs: DBObject[]): Promise<DBObject[]> {
        for (const obj of objs) {
            await task.none(`DELETE FROM ${table} WHERE ${PRIMARY_SETS[table]}`, obj)
        }
        return []
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
            const stat1 = await cur1.one('SELECT pg_try_advisory_lock(42) as lock')
            if (stat1.lock) {
                this.lock1 = cur1
                const stat2 = await cur2.one('SELECT pg_try_advisory_lock(42) as lock')
                if (stat2.lock) {
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
