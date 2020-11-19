import { EventEmitter } from 'events'
import datefns from 'date-fns'

import { db } from '@/db'
import { PasswordMap } from '@/db/mergeserverrepo'
import { synclog } from '@/util/logging'
import { MergeServerEntry } from './mergeserver'
import { executeSync, WrappedDatabaseInfo } from './dbwrapper'

export const syncwatcher = new EventEmitter()

export async function runOnce() {
    await db.task(async task => {
        const myserver  = new MergeServerEntry(await task.merge.getLocalMergeServer())
        const passwords = await task.merge.loadPasswords()
        const version   = await task.general.getSchemaVersion()

        // Check for any quickruns flags and do those first
        for (const remote of await task.merge.getQuickRuns()) {
            synclog.debug(`quickrun ${remote.hostname}`)
            await mergeRuns(myserver, new MergeServerEntry(remote), passwords)
        }

        // Recheck our current series list and hash values
        await myserver.updateSeriesFrom(task)
        for (const series in myserver.getSeries()) {
            await myserver.updateCacheFrom(task, version, series)
        }

        // Check if there are any timeouts for servers to merge with
        for (const remotedata of await task.merge.getActive()) {
            const remote = new MergeServerEntry(remotedata)
            if (datefns.isPast(remote.nextchecktime)) { // FINISH ME, timezone issue?!
                try {
                    await remote.serverStart(Object.keys(myserver.mergestate))
                    mergeWith(myserver, remote, passwords)
                    await remote.serverDone()
                } catch (e) {
                    synclog.error(`Caught exception merging with ${remote}: ${e}`)
                    syncwatcher.emit('exception', 'mergeloop', { remote: remote, exception: e })
                    await remote.serverError(e.toString())
                }
            }
        }
    }).catch(error => {
        synclog.error(`Caught exception in main loop: ${error}`)
        syncwatcher.emit('exception', 'runonce', { exception: error })
    })

    synclog.debug('Runonce exiting')
}



async function mergeRuns(myserver: MergeServerEntry, remoteserver: MergeServerEntry, passwords: PasswordMap) {
    //  During ProSolos we want to do quick merge of just the runs table back and forth between data entry machines """
    let error
    const series   = remoteserver.quickruns as string
    const password = passwords.get(series) as string
    if (!series || !password) return

    try {
        remoteserver.runsStart(series)
        await executeSync(myserver, remoteserver, series, password, async (wrap) => {
            mergeTables(wrap, new Set(['runs']))
        })
    } catch (e) {
        error = e
        synclog.warning(`Quick runs with ${remoteserver.hostname}/${series} failed: ${e}`)
        syncwatcher.emit('exception', 'mergruns', { remote: remoteserver, exception: e })
    } finally {
        remoteserver.runsDone(series, error)
    }
}


async function mergeWith(myserver: MergeServerEntry, remoteserver: MergeServerEntry, passwords: PasswordMap) {
}

/*
    def mergeWith(self, local, localdb, remote, passwords):
        """ Run a merge process with the specified remote server """
        # First connect to the remote server with nulluser just to update the list of active series
        log.debug("checking %s", remote)
        with DataInterface.connectRemote(server=remote, user='nulluser', password='nulluser') as remotedb:
            remote.updateSeriesFrom(remotedb)

        # Now, for each active series in the remote database, check if we have the password to connect
        for series in remote.mergestate.keys():
            error = None
            if series not in passwords:
                remote.seriesDone(series, "No password for %s, skipping" % (series,))
                continue

            try:
                assert not this.signalled, "Quit signal received"
                assert series in local.mergestate, "series was not created in local database yet"

                # Mark this series as the one we are actively merging with remote and make the series/password connection
                remote.seriesStart(series)
                with DataInterface.connectRemote(server=remote, user=series, password=passwords[series]) as remotedb:
                    remote.updateCacheFrom(remotedb, series)

                    # If the totalhash of our local copy differs from the remote copy, we need to actually do something
                    if remote.mergestate[series]['totalhash'] != local.mergestate[series]['totalhash']:
                        log.debug("Need to merge %s:", series)

                        # Obtain a merge lock on both sides, find which tables different and run mergeTables()
                        with DataInterface.mergelocks(local, localdb, remote, remotedb, series):
                            ltables = local.mergestate[series]['hashes']
                            rtables = remote.mergestate[series]['hashes']
                            this.mergeTables(local=local, localdb=localdb, remote=remote, remotedb=remotedb, series=series,
                                tables=set([k for k in set(ltables)|set(rtables) if ltables.get(k) != rtables.get(k)]))
                            remote.seriesStatus(series, "Commit Changes")

            except Exception as e:
                error = str(e)
                log.warning("Merge with %s/%s failed: %s", remote.hostname, series, e, exc_info=e)
                this.listener and this.listener("exception", "mergewith", localdb=localdb, remote=remote, exception=e)

            finally:
                remote.seriesDone(series, error)



                mergeTables(wrap, tables=set(['runs']))
*/

async function mergeTables(wrap: WrappedDatabaseInfo, tables: Set<string>) {
}

/*
    def mergeTables(self, **kwargs): # local, localdb, remote, remotedb, series, tables
        """ Outer loop to rerun mergeTables and rerun, if for some reason we are still not up to date """
        try:
            count = 0
            watcher = DBWatcher(**kwargs)
            watcher.start()
            tables = kwargs['tables']
            for ii in range(5):
                if len(tables) <= 0:
                    break
                tables = this._mergeTablesInternal(watcher=watcher, **kwargs)
                if tables:
                    log.warning("unfinished tables = %s", tables)
            else:
                log.error("Ran merge tables 5 times and not complete.")

            # Rescan the tables to verify we are at the same state, do this in context of DBWatcher for slow connections
            series   = kwargs['series']
            localdb  = kwargs['localdb']
            remotedb = kwargs['remotedb']
            kwargs['remote'].updateCacheFrom(remotedb, series)
            kwargs['local'].updateCacheFrom(localdb, series)
            kwargs['remote'].mergestate[series].pop('error', None)

            # Just in case, we have anything still hanging, commit now
            remotedb.commit()
            localdb.commit()
        finally:
            if watcher:
                watcher.stop()



    def _mergeTablesInternal(self, local, localdb, remote, remotedb, series, tables, watcher):
        """ The core function for actually finding the real differences and applying them locally or remotely """
        localinsert = defaultdict(list)
        localupdate = defaultdict(list)
        localdelete = defaultdict(list)
        localundelete = defaultdict(list)

        remoteinsert = defaultdict(list)
        remoteupdate = defaultdict(list)
        remotedelete = defaultdict(list)
        remoteundelete = defaultdict(list)

        for t in tables:
            assert not this.signalled, "Quit signal received"
            remote.seriesStatus(series, "Analysis {}".format(t))
            this.listener and this.listener("analysis", t, localdb=localdb, remotedb=remotedb, watcher=watcher)

            # Load data from both databases, load it all in one go to be more efficient in updates later
            watcher.local()
            localobj  = PresentObject.loadPresent(localdb, t)
            watcher.remote()
            remoteobj = PresentObject.loadPresent(remotedb, t)
            watcher.off()

            l = set(localobj.keys())
            r = set(remoteobj.keys())

            # Keys in both databases
            for pk in l & r:
                if localobj[pk].modified == remoteobj[pk].modified:
                    # Same keys, same modification time, filter out now, no need to further process
                    del localobj[pk]
                    del remoteobj[pk]
                    continue
                if localobj[pk].modified > remoteobj[pk].modified:
                    remoteupdate[t].append(localobj[pk])
                else:
                    localupdate[t].append(remoteobj[pk])

            # Recalc as we probably removed alot of stuff in the previous step
            l = set(localobj.keys())
            r = set(remoteobj.keys())

            # Only need to know about things deleted so far back in time based on mod times in other database
            watcher.local()
            ldeleted = DeletedObject.deletedSince( localdb, t,  PresentObject.minmodtime(remoteobj))
            watcher.remote()
            rdeleted = DeletedObject.deletedSince(remotedb, t,  PresentObject.minmodtime(localobj))
            watcher.off()

            # pk only in local database
            for pk in l - r:
                if pk in rdeleted:
                    localdelete[t].append(rdeleted[pk])
                else:
                    remoteinsert[t].append(localobj[pk])

            # pk only in remote database
            for pk in r - l:
                if pk in ldeleted:
                    remotedelete[t].append(ldeleted[pk])
                else:
                    localinsert[t].append(remoteobj[pk])

            log.debug("{}  local {} {} {}".format(t,  len(localinsert[t]),  len(localupdate[t]),  len(localdelete[t])))
            log.debug("{} remote {} {} {}".format(t, len(remoteinsert[t]), len(remoteupdate[t]), len(remotedelete[t])))

        # Have to insert data starting from the top of any foreign key links
        # And then update/delete from the bottom of the same links
        unfinished = set()

        # Insert order first (top down)
        for t in DataInterface.TABLE_ORDER:
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


        # Update/delete order next (bottom up)
        log.debug("Performing updates/deletes")
        for t in reversed(DataInterface.TABLE_ORDER):
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

        # If we have foreign key violations trying to delete, we need to readd those back to the opposite site and redo the merge
        # The only time this should ever occur is with the drivers table as its shared between series
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
