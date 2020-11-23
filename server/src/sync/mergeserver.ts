import _ from 'lodash'
import crypto from 'crypto'
import datefns from 'date-fns'

import { formatToTimestamp, parseTimestamp, UTCString, UUID } from '@/common/util'
import { ScorekeeperProtocol } from '@/db'
import { MergeServer } from '@/db/mergeserverrepo'
import { synclog } from '@/util/logging'
import { SchemaError } from '@/db/generalrepo'
import { HASH_COMMANDS } from './constants'

const ONESHOT  = '1'
const INACTIVE = 'I'
const ACTIVE   = 'A'

export class MergeServerEntry implements MergeServer {
    serverid: UUID
    hostname: string
    address: string
    lastcheck: UTCString
    nextcheck: UTCString
    waittime: number
    ctimeout: number
    cfailures: number
    hoststate: string
    quickruns: string|null
    mergestate: {
        [series: string]: {
            error?: string
            progress?: string
            syncing?: boolean
            lastchange?: {
                obj: number,
                log: number
            }
            totalhash?: string
            hashes?: {
                [table: string]: string
            }
        }
    }

    constructor(data: MergeServer, private localdb: ScorekeeperProtocol) {
        Object.assign(this, data)
    }

    get lastchecktime(): Date {
        return parseTimestamp(this.lastcheck)
    }

    set lastchecktime(time: Date) {
        this.lastcheck = formatToTimestamp(time)
    }

    get nextchecktime(): Date {
        return parseTimestamp(this.nextcheck)
    }

    set nextchecktime(time: Date) {
        this.nextcheck = formatToTimestamp(time)
    }

    getSeries(): string[] {
        return Object.keys(this.mergestate)
    }

    async runsStart(series: string) {
        await this.seriesStart(series)
    }

    async runsDone(series: string, error: string|undefined) {
        await this.seriesDone(series, error)
        this.quickruns = null
        await this.localdb.merge.updateMergeItems(this, ['quickruns'])
    }

    async seriesStart(series: string) {
        // Called when we start merging a given series with this remote server
        delete this.mergestate[series].error
        this.mergestate[series].syncing = true
        await this.localdb.merge.updateMergeItems(this, ['mergestate'])
    }

    async seriesStatus(series: string, status: string) {
        // Called with current status for the given series while merging with this remote server """
        synclog.debug(`seriesstatus: ${status}`)
        this.mergestate[series].progress = status
        await this.localdb.merge.updateMergeItems(this, ['mergestate'])
    }

    async seriesDone(series: string, error: string|undefined) {
        // Called when we are done merging the given series with this remote server, error is None for when successful """
        if (!error) {
            delete this.mergestate[series].error
        } else {
            synclog.info(`series ${series} reported ${error}`)
            if (error.includes('password authentication failed')) {
                this.mergestate[series].error = 'Password Incorrect'
            } else {
                this.mergestate[series].error = error
            }
        }
        delete this.mergestate[series].progress
        delete this.mergestate[series].syncing
        await this.localdb.merge.updateMergeItems(this, ['mergestate'])
    }

    async serverStart(localseries: string[]) {
        // Called when we start a merge process with this remote server
        for (const series in localseries) {
            if (!(series in this.mergestate)) {
                this.ensureSeriesBase(series)
            }
        }
        await this.localdb.merge.updateMergeItems(this, ['mergestate'])
    }

    async serverError(error: string) {
        // Called when the merge attempt with the remove server throws an exception, most likely a connection error """
        for (const series in this.mergestate) {
            this.mergestate[series].error = error
        }
        if (this.hoststate === ONESHOT) {
            this.hoststate = INACTIVE
            await this.localdb.merge.updateMergeItems(this, ['hoststate']) //  hoststate ownership is shared with frontend
        }
        await this.localdb.merge.updateMergeItems(this, ['mergestate'])
    }

    async serverDone() {
        // Called when the merge with the remote server completes without any exceptions
        if (this.hoststate === ONESHOT) {
            this.hoststate = INACTIVE
            await this.localdb.merge.updateMergeItems(this, ['hoststate']) // hoststate ownership is shared with frontend
        }
        this.lastchecktime = new Date()
        if ([ACTIVE, ONESHOT].includes(this.hoststate)) {
            this.nextchecktime = datefns.addSeconds(this.lastchecktime, this.waittime + (Math.random() * 5))
        } else {
            this.nextchecktime = new Date(0)
        }
        await this.localdb.merge.updateMergeItems(this, ['lastcheck', 'nextcheck', 'mergestate']) // nextcheck ownership is shared with frontend
    }



    async updateSeriesFrom(targetdb: ScorekeeperProtocol) {
        // Update the mergestate dict related to deleted or added series
        const serieslist   = await targetdb.series.seriesList()
        const cachedseries = Object.keys(this.mergestate)
        if (_.isEqual(serieslist, cachedseries)) {
            return
        }

        for (const deleted in cachedseries.filter(s => !serieslist.includes(s))) delete this.mergestate[deleted]
        for (const added   in serieslist.filter(s => !cachedseries.includes(s))) this.ensureSeriesBase(added)
        await this.localdb.merge.updateMergeItems(this, ['mergestate'])
    }



    async updateCacheFrom(targetdb: ScorekeeperProtocol, series: string, expectversion?: string) {
        this.ensureSeriesBase(series)
        const seriesstate = this.mergestate[series]

        await targetdb.task(async task => {
            if (expectversion) {
                const version = await task.general.getSchemaVersion()
                if (version !== expectversion) { throw new SchemaError(`Remote schema is ${version}, local is ${expectversion}`) }
            }

            // Do a sanity check on the log tables to see if anyting actually changed since our last check
            task.series.setSeries(series)
            const last = await task.one('SELECT MAX(otimes.max) as maxo, MAX(ltimes.max) as maxl FROM ' +
                        '(SELECT max(otime) FROM serieslog UNION ALL SELECT max(otime) FROM publiclog) AS otimes, ' +
                        '(SELECT max(ltime) FROM serieslog UNION ALL SELECT max(ltime) FROM publiclog) as ltimes')


            // 1 forces initial check on blank database
            const lastchange = {
                obj: last.maxo ? parseTimestamp(last.maxo).getTime() : 1,
                log: last.maxl ? parseTimestamp(last.maxl).getTime() : 1
            }

            // If there is no need to recalculate hashes or update local cache, skip out now
            if (_.isEqual(lastchange, seriesstate.lastchange)) {
                synclog.debug(`${targetdb} ${series} lastlog time shortcut`)
                return
            }

            synclog.debug(`${targetdb} ${series} perform hash computations`)
            // Something has changed, run through the process of caclulating hashes of the PK,modtime combos for each table and combining them together
            seriesstate.hashes = {}
            const totalhash = crypto.createHash('sha1')
            let hasdata = false

            for (const [table, command] of Object.entries(HASH_COMMANDS)) {
                const hashrow = await task.one(command)
                if (!hashrow.sum1) {
                    seriesstate.hashes[table] = ''
                } else {
                    const tablehash = crypto.createHash('sha1')
                    tablehash.update(new Float64Array([parseInt(hashrow.sum1), parseInt(hashrow.sum9), parseInt(hashrow.sum17), parseInt(hashrow.sum25)]))
                    const digest = tablehash.digest()
                    totalhash.update(digest) // <==== FINISH ME, is this correct
                    seriesstate.hashes[table] = digest.toString('base64')
                    hasdata = true
                }
            }

            // Make note if all blank tables, we can optimize to a download only during merge
            if (hasdata) {
                seriesstate.totalhash = totalhash.digest().toString('base64')
            } else {
                seriesstate.totalhash = ''
            }

            if (lastchange) {
                seriesstate.lastchange = lastchange
            }
        })

        await this.localdb.merge.updateMergeItems(this, ['mergestate'])
    }



    private async ensureSeriesBase(series: string) {
        // Make sure that some required structure is present in a series state object
        if (!(series in this.mergestate)) {
            this.mergestate[series] = {}
        }
        const state = this.mergestate[series]
        if (!state.lastchange) state.lastchange = { obj: 0, log: 0 }
        if (!state.totalhash)  state.totalhash  = ''
        if (!state.hashes)     state.hashes     = {}
    }
}
