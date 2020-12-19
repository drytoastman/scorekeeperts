import { isPast } from 'date-fns'
import { EventEmitter } from 'events'

import { DefaultMap, difference, intersect } from 'sctypes/data'
import { parseTimestamp } from 'sctypes/util'
import { db, ScorekeeperProtocol, ScorekeeperProtocolDB } from 'scdb'
import { synclog } from '@/util/logging'

import { getRemoteDB } from './connections'
import { ADVANCED_UPDATE_TABLES, INTERTWINED_DATA, LOCAL_TIMEOUT, TABLE_ORDER } from './constants'
import { performSyncWrap, SyncProcessInfo } from './dbwrapper'
import { MergeServerEntry } from './mergeserver'
import { DBObject, DeletedObject, getPKHash, KillSignalError, mincreatetime, minmodtime, PrimaryKeyHash, SyncError, SyncErrors, TableName } from './types'

export const syncwatcher  = new EventEmitter()
export let syncKillSignal = false
let syncIsActive = false

export async function runSyncOnce(rootdb?: ScorekeeperProtocolDB) {
    if (syncIsActive) {
        throw new SyncError('Request to sync but there is already an active sync ocurring on the database')
    }
    syncIsActive   = true
    syncKillSignal = false

    await (rootdb || db).task(async roottask => {
        await roottask.none('SET idle_in_transaction_session_timeout=$1', [LOCAL_TIMEOUT])

        let myserver: MergeServerEntry
        try {
            myserver = new MergeServerEntry(await roottask.merge.getLocalMergeServer(), roottask)
        } catch (error) {
            throw new SyncError('Unable to load local server info: ' + error.message)
        }

        // Check for any quickruns flags and do those first
        for (const remote of (await roottask.merge.getQuickRuns()).map(d => new MergeServerEntry(d, roottask))) {
            synclog.debug(`quickrun ${remote.hostname}`)
            await mergeRuns(roottask, myserver, remote)
        }

        // Recheck our local series list and hash values
        await myserver.updateSeriesFrom(roottask)
        for (const series of myserver.getSeries()) {
            await myserver.updateCacheFrom(roottask, series)
        }

        // Check if there are any timeouts for servers to merge with
        for (const remote of (await roottask.merge.getActive()).map(d => new MergeServerEntry(d, roottask))) {
            if (isPast(remote.nextchecktime)) {
                try {
                    await remote.serverStart(Object.keys(myserver.mergestate))
                    await mergeWith(roottask, myserver, remote)
                    await remote.serverDone()
                } catch (e) {
                    synclog.error(`Caught exception merging with ${remote.display}: ${e}`)
                    syncwatcher.emit('exception', { label: 'mergeloop', remote: remote, exception: e })
                    await remote.serverError(e.toString())
                }
            }
        }

    }).catch(error => {
        synclog.error(`Caught exception in main loop: ${error}`)
        syncwatcher.emit('exception', { label: 'runonce', exception: error })
        throw error
    }).finally(() => {
        syncIsActive = false
    })

    // synclog.debug('Runonce exiting')
}



async function mergeRuns(roottask: ScorekeeperProtocol, myserver: MergeServerEntry, remoteserver: MergeServerEntry) {
    //  During ProSolos we want to do quick merge of just the runs table back and forth between data entry machines """
    let error
    const series = remoteserver.quickruns as string
    if (!series) return

    try {
        remoteserver.runsStart(series)
        await performSyncWrap(roottask, myserver, remoteserver, series, async (wrap) => {
            mergeTables(wrap, ['runs'])
        })
    } catch (e) {
        error = e
        synclog.warn(`Quick runs with ${remoteserver.hostname}/${series} failed: ${e}`)
        syncwatcher.emit('exception', { label: 'mergruns', remote: remoteserver, exception: e })
    } finally {
        remoteserver.runsDone(series, error)
    }
}


async function mergeWith(roottask: ScorekeeperProtocol, myserver: MergeServerEntry, remoteserver: MergeServerEntry) {
    // Run a merge process with the specified remote server
    // First connect to the remote server with nulluser just to update the list of active series
    synclog.debug(`checking ${remoteserver.display}`)
    await remoteserver.updateSeriesFrom(getRemoteDB(remoteserver, 'nulluser', 'nulluser'))

    // Now, for each active series in the remote database, check if we have the password to connect
    for (const series in remoteserver.mergestate) {
        let error
        try {
            if (syncKillSignal) throw new KillSignalError()
            if (!(series in myserver.mergestate)) {
                synclog.debug(`${series} is not created in local database yet`)
                continue
            }

            //  Mark this series as the one we are actively merging with remote and make the series/password connection
            await remoteserver.seriesStart(series)
            await performSyncWrap(roottask, myserver, remoteserver, series, async (wrap) => {
                await wrap.updateRemoteCache()

                // If the totalhash of our local copy differs from the remote copy, we need to actually do something
                if (wrap.seriesHashDiffers()) {
                    synclog.debug(`Need to merge ${series}`)
                    await mergeTables(wrap, wrap.differingTables())
                    await wrap.remoteStatus('merge tables done (commit status)')
                }
            })

        } catch (e) {
            error = e.toString()
            synclog.warn(`Merge with ${remoteserver.display}/${series} failed: ${e}`)
            syncwatcher.emit('exception', { label: 'mergewith', remote: remoteserver, exception: e })
            if (e.name === SyncErrors.KillSignal) throw e
        } finally {
            await remoteserver.seriesDone(series, error)
        }
    }
}


async function mergeTables(wrap: SyncProcessInfo, tables: string[]) {
    // Outer loop to rerun mergeTables and rerun, if for some reason we are still not up to date
    let mtables = [...tables] // copy table
    let ii
    for (ii = 0; ii < 5; ii++) {
        if (mtables.length <= 0) {
            break
        }
        mtables = await mergeTablesInternal(wrap, mtables)
        if (mtables.length) {
            synclog.warn(`unfinished tables = ${mtables}`)
        }
    }
    if (ii === 5) {
        synclog.error('Ran merge tables 5 times and not complete.')
    }

    // Rescan the tables to verify we are at the same state
    wrap.clearRemoteError()
    await wrap.updateRemoteCache()
    await wrap.updateLocalCache()
}


async function mergeTablesInternal(wrap: SyncProcessInfo, tables: string[]): Promise<string[]> {

    const checkpoint = async (type: string, table: string) => {
        if (syncKillSignal) throw new KillSignalError()
        await wrap.remoteStatus(`${type} ${table}`)
        syncwatcher.emit(type, { table, wrap })
    }

    const localinsert   = new DefaultMap<TableName, DBObject[]>(() => [])
    const localupdate   = new DefaultMap<TableName, DBObject[]>(() => [])
    const localdelete   = new DefaultMap<TableName, DeletedObject[]>(() => [])
    const localundelete = new DefaultMap<TableName, DBObject[]>(() => [])

    const remoteinsert   = new DefaultMap<TableName, DBObject[]>(() => [])
    const remoteupdate   = new DefaultMap<TableName, DBObject[]>(() => [])
    const remotedelete   = new DefaultMap<TableName, DeletedObject[]>(() => [])
    const remoteundelete = new DefaultMap<TableName, DBObject[]>(() => [])

    // eslint-disable-next-line no-unreachable-loop
    for (const t of tables) {
        await checkpoint('analysis', t)

        // Load data from both databases, load it all in one go to be more efficient in updates later
        const [localobj, remoteobj] = await wrap.loadAll(t)
        const [ldeleted, rdeleted]  = await wrap.deletedSince(t, minmodtime(remoteobj), minmodtime(localobj))

        let l = new Set(localobj.keys())
        let r = new Set(remoteobj.keys())

        // Keys in both databases
        for (const pk of intersect(l, r)) {
            const [lo, ro] = [localobj.get(pk) as DBObject, remoteobj.get(pk) as DBObject]
            const lmod = parseTimestamp(lo.modified).getTime()
            const rmod = parseTimestamp(ro.modified).getTime()

            if (lmod === rmod) {
                // Same keys, same modification time, filter out now, no need to further process
                localobj.delete(pk)
                remoteobj.delete(pk)
                continue
            } else if (lmod > rmod) {
                remoteupdate.getD(t).push(lo)
            } else {
                localupdate.getD(t).push(ro)
            }
        }

        // Recalc as we probably removed alot of stuff in the previous step
        l = new Set(localobj.keys())
        r = new Set(remoteobj.keys())

        // pk only in local database
        for (const pk of difference(l, r)) {
            if (rdeleted.has(pk)) {
                localdelete.getD(t).push(rdeleted.get(pk) as DeletedObject)
            } else {
                remoteinsert.getD(t).push(localobj.get(pk) as DBObject)
            }
        }

        // pk only in remote database
        for (const pk of difference(r, l)) {
            if (ldeleted.has(pk)) {
                remotedelete.getD(t).push(ldeleted.get(pk) as DeletedObject)
            } else {
                localinsert.getD(t).push(remoteobj.get(pk) as DBObject)
            }
        }

        synclog.debug(`${t}  local I${localinsert.getD(t).length}, U${localupdate.getD(t).length}, D${localdelete.getD(t).length}`)
        synclog.debug(`${t} remote I${remoteinsert.getD(t).length}, U${remoteupdate.getD(t).length}, D${remotedelete.getD(t).length}`)
    }

    // Have to insert data starting from the top of any foreign key links
    // And then update/delete from the bottom of the same links
    const unfinished = new Set<string>()

    // Insert order first (top down)
    for (const t of TABLE_ORDER) {
        if (localinsert.getD(t).length || remoteinsert.getD(t).length) {
            await checkpoint('insert', t)

            const complete = await wrap.insertAll(t, localinsert.getD(t), remoteinsert.getD(t))
            if (complete.some(v => !v)) unfinished.add(t)
        }
    }


    // Update/delete order next (bottom up)
    synclog.debug('Performing updates/deletes')
    for (let ii = TABLE_ORDER.length; ii >= 0; ii--) {
        const t = TABLE_ORDER[ii]

        if (localupdate.getD(t).length || remoteupdate.getD(t).length) {
            await checkpoint('update', t)

            if (ADVANCED_UPDATE_TABLES.includes(t)) {
                await advancedMerge(wrap, t, localupdate.getD(t), remoteupdate.getD(t))
            } else {
                const complete = await wrap.updateAll(t, localupdate.getD(t), remoteupdate.getD(t))
                if (complete.some(v => !v)) unfinished.add(t)
            }
        }


        if (localdelete.getD(t).length || remotedelete.getD(t).length) {
            await checkpoint('delete', t)

            const [local, remote] = await wrap.deleteAll(t, localdelete.getD(t), remotedelete.getD(t))
            remoteundelete.getD(t).push(...local)
            localundelete.getD(t).push(...remote)
        }
    }

    // If we have foreign key violations trying to delete, we need to readd those back to the opposite site and redo the merge
    // The only time this should ever occur is with the drivers table as its shared between series
    // execute single file on each database connection, but in parallel on different connections
    wrap.undeleteAll(localundelete, remoteundelete)

    // Special tables that need insert and update done without commits in between for constraints
    for (const t of INTERTWINED_DATA) {
        await checkpoint('intertwined', t)
        await wrap.insUpAll(t, localinsert.getD(t), localupdate.getD(t), remoteinsert.getD(t), remoteupdate.getD(t))
    }

    return [...unfinished]
}

async function advancedMerge(wrap: SyncProcessInfo, table: string, localupdate: DBObject[], remoteupdate: DBObject[]) {

    const localup  = new Map<PrimaryKeyHash, DBObject>()
    const remoteup = new Map<PrimaryKeyHash, DBObject>()
    const pkset    = new Set<PrimaryKeyHash>()
    for (const o of localupdate)  {
        const pk = getPKHash(table, o)
        localup.set(pk, o)
        pkset.add(pk)
    }
    for (const o of remoteupdate) {
        const pk = getPKHash(table, o)
        remoteup.set(pk, o)
        pkset.add(pk)
    }

    const when = mincreatetime(localupdate, remoteupdate)
    const loggedobj = await wrap.loggedObjects(pkset, table, when)

    // Create update objects and then update where needed
    const toupdatel = [] as DBObject[]
    const toupdater = [] as DBObject[]
    for (const lo of loggedobj.values()) {
        if (!lo) {
            continue
        }
        /* eslint-disable @typescript-eslint/no-non-null-assertion */
        if (localup.has(lo.pkhash)) {
            const res = lo.finalize(localup.get(lo.pkhash)!)
            toupdatel.push(res.obj)
            if (res.both) toupdater.push(res.obj)
        } else {
            const res = lo.finalize(remoteup.get(lo.pkhash)!)
            toupdater.push(res.obj)
            if (res.both) toupdatel.push(res.obj)
        }
        /* eslint-enable @typescript-eslint/no-non-null-assertion */
    }

    await wrap.updateAll(table, toupdatel, toupdater)
}
