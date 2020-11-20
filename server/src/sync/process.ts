import _ from 'lodash'
import { EventEmitter } from 'events'
import datefns from 'date-fns'

import { db } from '@/db'
import { synclog } from '@/util/logging'
import { MergeServerEntry } from './mergeserver'
import { getRemoteDB, performSyncWrap, SyncProcessInfo } from './dbwrapper'
import { DefaultMap, difference, intersect } from '@/common/data'
import { KillSignal, KillSignalError } from './constants'

export const syncwatcher = new EventEmitter()
export let killsignal = false

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
        for (const series in myserver.getSeries()) {
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

        let mtables = [...tables]
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

function minmodtime(objs: Map<any, any>): Date {
    let ret = 0
    for (const o of objs.values()) {
        if (o.modmsutc < ret) ret = o.modmsutc
    }
    return new Date(ret)
}

async function mergeTablesInternal(wrap: SyncProcessInfo, tables: string[], watcher: any): Promise<string[]> {
    //  The core function for actually finding the real differences and applying them locally or remotely """
    const localinsert   = new DefaultMap(() => [])
    const localupdate   = new DefaultMap(() => [])
    const localdelete   = new DefaultMap(() => [])
    const localundelete = new DefaultMap(() => [])

    const remoteinsert   = new DefaultMap(() => [])
    const remoteupdate   = new DefaultMap(() => [])
    const remotedelete   = new DefaultMap(() => [])
    const remoteundelete = new DefaultMap(() => [])

    for (const t of tables) {
        if (killsignal) throw new KillSignalError()
        wrap.remoteStatus(`Analysis ${t}`)
        syncwatcher.emit('analysis', t, { wrap, watcher })

        // Load data from both databases, load it all in one go to be more efficient in updates later
        // watcher.local() blah blah
        const [localobj, remoteobj] = await Promise.all([
                                    await wrap.loadLocalPresent(t),
                                    await wrap.loadRemotePresent(t)])
        // watcher.off()

        let l = new Set([...Object.keys(localobj)])
        let r = new Set([...Object.keys(remoteobj)])

        // Keys in both databases
        for (const pk in intersect(l, r)) {
            if (localobj[pk].modmsutc === remoteobj[pk].modmsutc) {
                // Same keys, same modification time, filter out now, no need to further process
                delete localobj[pk]
                delete remoteobj[pk]
                continue
            }
            if (localobj[pk].modmsutc > remoteobj[pk].modmsutc) {
                remoteupdate[t].append(localobj[pk])
            } else {
                localupdate[t].append(remoteobj[pk])
            }
        }

        // Recalc as we probably removed alot of stuff in the previous step
        l = new Set([...Object.keys(localobj)])
        r = new Set([...Object.keys(remoteobj)])

        // Only need to know about things deleted so far back in time based on mod times in other database
        // watcher.local()
        const [ldeleted, rdeleted] = await Promise.all([
                                    wrap.loadLocalDeletedSince(t, minmodtime(remoteobj)),
                                    wrap.loadRemoteDeletedSince(t, minmodtime(localobj))])
        // watcher.off()

        // pk only in local database
        for (const pk of difference(l, r)) {
            if (rdeleted.has(pk)) {
                localdelete[t].push(rdeleted[pk])
            } else {
                remoteinsert[t].push(localobj[pk])
            }
        }

        // pk only in remote database
        for (const pk of difference(r, l)) {
            if (ldeleted.has(pk)) {
                remotedelete[t].push(ldeleted[pk])
            } else {
                localinsert[t].push(remoteobj[pk])
            }
        }

        synclog.debug(`${t}  local ${localinsert[t].length}, ${localupdate[t].length}, ${localdelete[t].length}`)
        synclog.debug(`${t} remote ${remoteinsert[t].length}, ${remoteupdate[t].length}, ${remotedelete[t].length}`)
    }

    // Have to insert data starting from the top of any foreign key links
    // And then update/delete from the bottom of the same links
    /*
    unfinished = set()

    // Insert order first (top down)
    for (const t of TABLE_ORDER) {
        if localinsert[t] or remoteinsert[t]:
            assert not this.signalled, "Quit signal received"
            remote.seriesStatus(series, "Insert {}".format(t))
            this.listener and this.listener("insert", t, localdb=localdb, remotedb=remotedb, watcher=watcher)

            watcher.local()
            if not DataInterface.insert(localdb,  localinsert[t]):
                unfinished.add(t)
            watcher.remote()
            if not DataInterface.insert(remotedb, remoteinsert[t]):
                unfinished.add(t)
            watcher.off()
    }


    // Update/delete order next (bottom up)
    synclog.debug("Performing updates/deletes")
    for (const t of reversed(TABLE_ORDER)) {
        if localupdate[t] or remoteupdate[t]:
            assert not this.signalled, "Quit signal received"
            remote.seriesStatus(series, "Update {}".format(t))
            this.listener and this.listener("update", t, localdb=localdb, remotedb=remotedb, watcher=watcher)

            if t in DataInterface.ADVANCED_UPDATE_TABLES:
                this.advancedMerge(localdb, remotedb, t, localupdate[t], remoteupdate[t], watcher)
            else:
                watcher.local()
                if not DataInterface.update(localdb,  localupdate[t]):
                    unfinished.add(t)
                watcher.remote()
                if not DataInterface.update(remotedb, remoteupdate[t]):
                    unfinished.add(t)
                watcher.off()

        if localdelete[t] or remotedelete[t]:
            remote.seriesStatus(series, "Delete {}".format(t))
            this.listener and this.listener("delete", t, localdb=localdb, remotedb=remotedb, watcher=watcher)
            remoteundelete[t].extend(DataInterface.delete(localdb,  localdelete[t]))
            localundelete[t].extend(DataInterface.delete(remotedb, remotedelete[t]))
    }

    // If we have foreign key violations trying to delete, we need to readd those back to the opposite site and redo the merge
    // The only time this should ever occur is with the drivers table as its shared between series
    for t in remoteundelete:
        if remoteundelete[t]:
            log.warning("Remote undelete requests for {}: {}".format(t, len(remoteundelete[t])))
            remote.seriesStatus(series, "R-undelete {}".format(t))
            unfinished.add(t)
            DataInterface.insert(remotedb, remoteundelete[t])
    for t in localundelete:
        if localundelete[t]:
            log.warning("Local udelete requests for {}: {}".format(t, len(remoteundelete[t])))
            remote.seriesStatus(series, "L-undelete {}".format(t))
            unfinished.add(t)
            DataInterface.insert(localdb, localundelete[t])


    # Special tables that need insert and update done without commits in between for constraints
    for t in DataInterface.INTERTWINED_DATA:
        assert not this.signalled, "Quit signal received"
        this.listener and this.listener("ins/up", t, localdb=localdb, remotedb=remotedb, watcher=watcher)

        remote.seriesStatus(series, "Ins/Up {}".format(t))
        watcher.local()
        if localinsert[t]: DataInterface.insert(localdb,  localinsert[t], commit=False)
        if localupdate[t]: DataInterface.update(localdb,  localupdate[t])

        watcher.remote()
        if remoteinsert[t]: DataInterface.insert(remotedb,  remoteinsert[t], commit=False)
        if remoteupdate[t]: DataInterface.update(remotedb,  remoteupdate[t])

        watcher.off()


    return unfinished
    */
    return []
}



/*
    def advancedMerge(self, localdb, remotedb, table, remoteobj, localobj, watcher):
        when   = PresentObject.mincreatetime(localobj, remoteobj)
        local  = { l.pk:l for l in localobj  }
        remote = { r.pk:r for r in remoteobj }
        pkset  = local.keys() | remote.keys()

        loggedobj = dict()
        logtable  = DataInterface.logtablefor(table)

        watcher.local()
        LoggedObject.loadFrom(loggedobj, localdb,  pkset, logtable, table, when)
        watcher.remote()
        LoggedObject.loadFrom(loggedobj, remotedb, pkset, logtable, table, when)
        watcher.off()

        # Create update objects and then update where needed
        toupdatel = []
        toupdater = []
        for lo in loggedobj.values():
            if not lo:
                continue
            if lo.pk in local:
                update,both = lo.finalize(local[lo.pk])
                toupdater.append(update)
                if both: toupdatel.append(update)
            else:
                update,both = lo.finalize(remote[lo.pk])
                toupdatel.append(update)
                if both: toupdater.append(update)

        watcher.local()
        DataInterface.update(localdb, toupdatel)
        watcher.remote()
        DataInterface.update(remotedb, toupdater)
        watcher.off()
*/
