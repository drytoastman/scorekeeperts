import { parseTimestamp } from 'sctypes/util'
import { pgp, ScorekeeperProtocol, SYNCTABLES } from 'scdb'
import { synclog } from '@/util/logging'
import { getRemoteDB } from './connections'
import { asyncwait, FOREIGN_KEY_CONSTRAINT, logtablefor, PRIMARY_TVEQ, PRIMARY_SETS } from './constants'
import { MergeServerEntry } from './mergeserver'
import { DBObject, DeletedObject, getPKHash, LoggedObject, PrimaryKeyHash, SyncError, TableName } from './types'


/* eslint-disable lines-between-class-members */
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
        this.remoteserver.seriesStatus(this.series, status)
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

    async loggedObjects(watchset: Set<PrimaryKeyHash>, table: string, when: Date) {
        const objmap = new Map<PrimaryKeyHash, LoggedObject>()
        const src    = logtablefor(table)

        for (const task of [this.localtask, this.remotetask]) {
            for (const obj of await task.any('SELECT * FROM $1:raw WHERE tablen=$2 and otime>=$3 ORDER BY otime', [src, table, when])) {

                if (obj.action === 'I') {
                    const pkhash = getPKHash(table, obj.newdata)
                    if (!objmap.has(pkhash) && watchset.has(pkhash)) objmap.set(pkhash, new LoggedObject(table, pkhash))
                    if (objmap.has(pkhash))                          objmap.get(pkhash)?.insert(obj.otime, obj.ltime, obj.newdata)
                } else if (obj.action === 'U') {
                    const pkhash = getPKHash(table, obj.newdata)
                    if (objmap.has(pkhash))                            objmap.get(pkhash)?.update(obj.otime, obj.olddata, obj.newdata)
                } else if (obj.action === 'D') {
                    if (objmap.has(getPKHash(table, obj.olddata))) {
                        throw Error('LoggedObject delete is invalid')
                    }
                } else {
                    synclog.warning('How did we get here?')
                }
            }
        }
        return objmap
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
            ret.set(getPKHash(table, row.olddata), { data: row.olddata, deletedat: parseTimestamp(row.otime) })
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
            try {
                await task.none(pgp.helpers.insert(objs, SYNCTABLES[table]))
            } catch (error) {
                if (error.code === FOREIGN_KEY_CONSTRAINT) return false
                throw error
            }
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
            try {
                await task.none(pgp.helpers.update(objs, SYNCTABLES[table]) + PRIMARY_TVEQ[table])
            } catch (error) {
                if (error.code === FOREIGN_KEY_CONSTRAINT) return false
                throw error
            }
        }
        return true
    }


    async deleteAll(table: string, localobjs: DeletedObject[], remoteobjs: DeletedObject[]) {
        return Promise.all([
            this.delete(this.localtask, table, localobjs),
            this.delete(this.remotetask, table, remoteobjs)
        ])
    }
    private async delete(task: ScorekeeperProtocol, table: string, objs: DeletedObject[]): Promise<DBObject[]> {
        const logtable = logtablefor(table)
        const undelete = [] as DBObject[]
        for (const obj of objs) {
            try {
                if (!obj.deletedat) throw Error('deleteobj without deletedat value')
                await task.none(`DELETE FROM ${table} WHERE ${PRIMARY_SETS[table]}`, obj.data)
                await task.none('UPDATE $1:raw SET otime=$2 WHERE otime=CURRENT_TIMESTAMP', [logtable, obj.deletedat])
            } catch (error) {
                if (error.code === FOREIGN_KEY_CONSTRAINT) {
                    synclog.warn(`adding ${getPKHash(table, obj.data)} to undelete`)
                    undelete.push(obj.data)
                } else {
                    throw error
                }
            }
        }
        return undelete
    }

    async undeleteAll(localmap: Map<TableName, DBObject[]>, remotemap: Map<TableName, DBObject[]>) {
        return Promise.all([
            this.undelete(this.localtask, localmap),
            this.undelete(this.remotetask, remotemap)
        ])
    }
    private async undelete(task: ScorekeeperProtocol, tablemap: Map<TableName, DBObject[]>): Promise<void> {
        for (const [table, objs] of tablemap.entries()) {
            if (objs.length) {
                synclog.warn(`undelete requests for ${table}: ${objs.length}`)
                await task.any(pgp.helpers.insert(objs, SYNCTABLES[table]))
            }
        }
    }


    async insUpAll(table: string, localins: DBObject[], localup: DBObject[], remoteins: DBObject[], remoteup: DBObject[])  {
        return Promise.all([
            this.insup(this.localtask, table, localins, localup),
            this.insup(this.remotetask, table, remoteins, remoteup)
        ])
    }
    private async insup(task: ScorekeeperProtocol, table: string, ins: DBObject[], up: DBObject[]) {
        return task.tx(async (tx: ScorekeeperProtocol) => {
            if (ins.length) await tx.none(pgp.helpers.insert(ins, SYNCTABLES[table]))
            if (up.length)  await tx.none(pgp.helpers.update(up, SYNCTABLES[table]) + PRIMARY_TVEQ[table])
        })
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
