import _ from 'lodash'
import { EventEmitter } from 'events'
import datefns from 'date-fns'

import { db } from '@/db'
import { synclog } from '@/util/logging'
import { MergeServerEntry } from './mergeserver'
import { getRemoteDB, performSyncWrap, SyncProcessInfo } from './dbwrapper'
import { DefaultMap, difference, intersect } from '@/common/data'
import { ADVANCED_UPDATE_TABLES, TABLE_ORDER } from './constants'
import { parseTimestamp } from '@/common/util'
import { DBObject, DeletedObject, KillSignal, KillSignalError } from './types'

export const syncwatcher = new EventEmitter()
export let killsignal = false


function minmodtime(objs: Map<any, any>): Date {
    let ret = 0
    let ms
    for (const o of objs.values()) {
        ms = parseTimestamp(o.modified)
        if (ms < ret) ret = ms
    }
    return new Date(ret)
}

function mincreatetime(objs: DBObject[], objs2: DBObject[]): Date {
    let ret = 0
    let ms
    for (const o of objs)  {
        ms = parseTimestamp(o.created || '0')
        if (ms < ret) ret = ms
    }
    for (const o of objs2) {
        ms = parseTimestamp(o.created || '0')
        if (ms < ret) ret = ms
    }
    return new Date(ret)
}

export async function runOnce() {
    await db.task(async task => {
        const myserver  = new MergeServerEntry(await task.merge.getLocalMergeServer())

        // Check for any quickruns flags and do those first
        for (const remote of (await task.merge.getQuickRuns()).map(d => new MergeServerEntry(d))) {
            synclog.debug(`quickrun ${remote.hostname}`)
            await mergeRuns(myserver, remote)
        }

        // Recheck our local series list and hash values
        await myserver.updateSeriesFrom(task)
        for (const series of myserver.getSeries()) {
            await myserver.updateCacheFrom(task, series)
        }

        // Check if there are any timeouts for servers to merge with
        for (const remote of (await task.merge.getActive()).map(d => new MergeServerEntry(d))) {
            if (datefns.isPast(remote.nextchecktime)) { // FINISH ME, timezone issue?!
                try {
                    await remote.serverStart(Object.keys(myserver.mergestate))
                    await mergeWith(myserver, remote)
                    await remote.serverDone()
                } catch (e) {
                    synclog.error(`Caught exception merging with ${remote}: ${e}`)
                    syncwatcher.emit('exception', 'mergeloop', { remote: remote, exception: e })
                    await remote.serverError(e.toString())
                }
            }
        }

        killsignal = true // placeholder for typesript warning
    }).catch(error => {
        synclog.error(`Caught exception in main loop: ${error}`)
        syncwatcher.emit('exception', 'runonce', { exception: error })
    })

    synclog.debug('Runonce exiting')
}



async function mergeRuns(myserver: MergeServerEntry, remoteserver: MergeServerEntry) {
    //  During ProSolos we want to do quick merge of just the runs table back and forth between data entry machines """
    let error
    const series = remoteserver.quickruns as string
    if (!series) return

    try {
        remoteserver.runsStart(series)
        await performSyncWrap(myserver, remoteserver, series, async (wrap) => {
            mergeTables(wrap, ['runs'])
        })
    } catch (e) {
        error = e
        synclog.warning(`Quick runs with ${remoteserver.hostname}/${series} failed: ${e}`)
        syncwatcher.emit('exception', 'mergruns', { remote: remoteserver, exception: e })
    } finally {
        remoteserver.runsDone(series, error)
    }
}


async function mergeWith(myserver: MergeServerEntry, remoteserver: MergeServerEntry) {
    // Run a merge process with the specified remote server
    // First connect to the remote server with nulluser just to update the list of active series
    synclog.debug(`checking ${remoteserver}`)
    remoteserver.updateSeriesFrom(getRemoteDB(remoteserver, 'nulluser', 'nulluser'))

    // Now, for each active series in the remote database, check if we have the password to connect
    for (const series in remoteserver.mergestate) {
        let error
        try {
            if (killsignal) throw new KillSignalError()
            if (!(series in myserver.mergestate)) {
                synclog.error('series was not created in local database yet')
                continue
            }

            //  Mark this series as the one we are actively merging with remote and make the series/password connection
            remoteserver.seriesStart(series)
            await performSyncWrap(myserver, remoteserver, series, async (wrap) => {
                wrap.updateRemoteCache()

                // If the totalhash of our local copy differs from the remote copy, we need to actually do something
                if (wrap.seriesHashDiffers()) {
                    synclog.debug(`Need to merge ${series}`)
                    mergeTables(wrap, wrap.differingTables())
                    wrap.remoteStatus('Commit Changes')
                }
            })

        } catch (e) {
            error = e.toString()
            synclog.warning(`Merge with ${remoteserver.hostname}/${series} failed: ${e}`)
            syncwatcher.emit('exception', 'mergewith', { remote: remoteserver, exception: e })
            if (e.name === KillSignal) throw e
        } finally {
            remoteserver.seriesDone(series, error)
        }
    }
}


async function mergeTables(wrap: SyncProcessInfo, tables: string[]) {
    // Outer loop to rerun mergeTables and rerun, if for some reason we are still not up to date
    let watcher
    try {
        const count = 0
        // watcher = DBWatcher(wrap)  FINISH ME, do we still need to track blocking the frontend apps?
        // watcher.start()

        let mtables = [...tables] // copy table
        let ii
        for (ii = 0; ii < 5; ii++) {
            if (mtables.length <= 0) {
                break
            }
            mtables = await mergeTablesInternal(wrap, mtables, watcher)
            if (mtables.length) {
                synclog.warning(`unfinished tables = ${mtables}`)
            }
        }
        if (ii === 5) {
            synclog.error('Ran merge tables 5 times and not complete.')
        }

        // Rescan the tables to verify we are at the same state, do this in context of DBWatcher for slow connections
        wrap.clearRemoteError()
        wrap.updateRemoteCache()
        wrap.updateLocalCache()
    } finally {
        // if (watcher) watcher.stop()
    }
}


async function mergeTablesInternal(wrap: SyncProcessInfo, tables: string[], watcher: any): Promise<string[]> {
    //  The core function for actually finding the real differences and applying them locally or remotely """
    const localinsert   = new DefaultMap(() => [] as DBObject[])
    const localupdate   = new DefaultMap(() => [] as DBObject[])
    const localdelete   = new DefaultMap(() => [] as DeletedObject[])
    const localundelete = new DefaultMap(() => [] as DBObject[])

    const remoteinsert   = new DefaultMap(() => [] as DBObject[])
    const remoteupdate   = new DefaultMap(() => [] as DBObject[])
    const remotedelete   = new DefaultMap(() => [] as DeletedObject[])
    const remoteundelete = new DefaultMap(() => [] as DBObject[])

    for (const t of tables) {
        if (killsignal) throw new KillSignalError()
        wrap.remoteStatus(`Analysis ${t}`)
        syncwatcher.emit('analysis', t, { wrap, watcher })

        // Load data from both databases, load it all in one go to be more efficient in updates later
        // watcher.local() blah blah
        const [localobj, remoteobj] = await Promise.all([
                                    await wrap.loadLocal(t),
                                    await wrap.loadRemote(t)])
        // watcher.off()

        let l = new Set(localobj.keys())
        let r = new Set(remoteobj.keys())

        // Keys in both databases
        for (const pk of intersect(l, r)) {
            const [lo, ro] = [localobj.get(pk) as DBObject, remoteobj.get(pk) as DBObject]
            if (lo.modmsutc === ro.modmsutc) {
                // Same keys, same modification time, filter out now, no need to further process
                localobj.delete(pk)
                remoteobj.delete(pk)
                continue
            }
            if (lo.modmsutc > ro.modmsutc) {
                remoteupdate.getD(t).push(lo)
            } else {
                localupdate.getD(t).push(lo)
            }
        }

        // Recalc as we probably removed alot of stuff in the previous step
        l = new Set(localobj.keys())
        r = new Set(remoteobj.keys())

        // Only need to know about things deleted so far back in time based on mod times in other database
        // watcher.local()
        const [ldeleted, rdeleted] = await Promise.all([
                                    wrap.deletedSinceLocal(t, minmodtime(remoteobj)),
                                    wrap.deletedSinceRemote(t, minmodtime(localobj))])
        // watcher.off()

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

        synclog.debug(`${t}  local ${localinsert.getD(t).length}, ${localupdate.getD(t).length}, ${localdelete.getD(t).length}`)
        synclog.debug(`${t} remote ${remoteinsert.getD(t).length}, ${remoteupdate.getD(t).length}, ${remotedelete.getD(t).length}`)
    }

    // Have to insert data starting from the top of any foreign key links
    // And then update/delete from the bottom of the same links
    const unfinished = new Set<string>()

    // Insert order first (top down)
    for (const t of TABLE_ORDER) {
        if (localinsert.getD(t).length || remoteinsert.getD(t).length) {
            if (killsignal) throw new KillSignalError()
            wrap.remoteStatus(`Insert ${t}`)
            syncwatcher.emit('insert', { table: t, wrap, watcher })

            // watcher.local()
            const [ul, ur] = await Promise.all([wrap.insertLocal(t, localinsert.getD(t)), wrap.insertRemote(t, remoteinsert.getD(t))])
            if (!ul || !ur) unfinished.add(t)
            // watcher.off()
        }
    }


    // Update/delete order next (bottom up)
    synclog.debug('Performing updates/deletes')
    for (let ii = TABLE_ORDER.length; ii >= 0; ii++) {
        const t = TABLE_ORDER[ii]
        if (killsignal) throw new KillSignalError()

        if (localupdate.getD(t).length || remoteupdate.getD(t).length) {
            wrap.remoteStatus(`Update ${t}`)
            syncwatcher.emit('update', { table: t, wrap, watcher })

            if (ADVANCED_UPDATE_TABLES.includes(t)) {
                advancedMerge(wrap, t, localupdate.getD(t), remoteupdate.getD(t))
            } else {
                // watcher.local()
                const [ul, ur] = await Promise.all([wrap.updateLocal(t, localupdate.getD(t)), wrap.updateRemote(t, remoteupdate.getD(t))])
                if (!ul || !ur) unfinished.add(t)
                // watcher.off()
            }
        }

        if (localdelete.getD(t).length || remotedelete.getD(t).length) {
            wrap.remoteStatus(`Delete ${t}`)
            syncwatcher.emit('delete', { table: t, wrap, watcher })

            const [local, remote] = await Promise.all([wrap.deleteLocal(t, localdelete.getD(t)), wrap.deleteRemote(t, remotedelete.getD(t))])
            remoteundelete.getD(t).push(...local)
            localundelete.getD(t).push(...remote)
        }
    }

    // If we have foreign key violations trying to delete, we need to readd those back to the opposite site and redo the merge
    // The only time this should ever occur is with the drivers table as its shared between series
    // execute single file on each database connection, but in parallel on different connections
    await Promise.all([
        async () => {
            for (const t in remoteundelete) {
                if (remoteundelete.getD(t).length) {
                    synclog.warning(`Remote undelete requests for ${t}: ${remoteundelete.getD(t).length}`)
                    wrap.remoteStatus(`R-undelete ${t}`)
                    unfinished.add(t)
                    await wrap.insertRemote(t, remoteinsert.getD(t))
                }
            }
        },
        async () => {
            for (const t in localundelete) {
                if (localundelete.getD(t).length) {
                    synclog.warning(`Local udelete requests for ${t}: ${localundelete.getD(t).length}`)
                    wrap.remoteStatus(`L-undelete ${t}`)
                    unfinished.add(t)
                    await wrap.insertLocal(t, localinsert.getD(t))
                }
            }
        }
    ])

    return [...unfinished]
}


async function advancedMerge(wrap: SyncProcessInfo, table: string, localobj: DBObject[], remoteobj: DBObject[]) {

    const local = new Map()
    const remote = new Map()
    const pkset = new Set()
    for (const o of localobj)  { local.set(o.pk, o);  pkset.add(o.pk) }
    for (const o of remoteobj) { remote.set(o.pk, o); pkset.add(o.pk) }

    const loggedobj = new Map()
    const when      = mincreatetime(localobj, remoteobj)

    // watcher.local()
    wrap.loggedLocal(loggedobj,  pkset, table, when)
    wrap.loggedRemote(loggedobj, pkset, table, when)
    // watcher.off()

    // Create update objects and then update where needed
    const toupdatel = [] as DBObject[]
    const toupdater = [] as DBObject[]
    for (const lo of loggedobj.values()) {
        if (!lo) {
            continue
        }
        if (local.has(lo.pk)) {
            const [update, both] = lo.finalize(local[lo.pk])
            toupdater.push(update)
            if (both) toupdatel.push(update)
        } else {
            const [update, both] = lo.finalize(remote[lo.pk])
            toupdatel.push(update)
            if (both) toupdater.push(update)
        }
    }

    // watcher.local()
    await wrap.updateLocal(table, toupdatel)
    await wrap.updateRemote(table, toupdater)
    // watcher.off()
}
