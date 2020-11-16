import { Car } from '@/common/car'
import { ClassData } from '@/common/classindex'
import { decorateClassResults, decorateChampResults, getBestNetRun } from '@/common/decorate'
import { SeriesEvent } from '@/common/event'
import { ChampResults, EventResults, Entrant } from '@/common/results'
import { SeriesSettings } from '@/common/settings'
import { UUID } from '@/common/util'
import { ScorekeeperProtocol } from '@/db'

export class LazyData {

    _events:     Map<UUID, SeriesEvent> = new Map()
    _cars:       Map<UUID, Car>      = new Map()
    _settings:   SeriesSettings|null = null
    _classdata:  ClassData|null      = null
    _eresults:   Map<UUID, any>      = new Map()
    _cresults:   ChampResults|null   = null
    _calculated: Map<any, any>       = new Map()
    task: ScorekeeperProtocol

    constructor(task: ScorekeeperProtocol) {
        this.task = task
    }

    async getEvent(eventid: UUID) {
        if (!this._events.has(eventid)) {
            this._events.set(eventid, await this.task.events.getEvent(eventid))
        }
        return this._events.get(eventid) as SeriesEvent
    }

    async getCar(carid: UUID) {
        if (!this._cars.has(carid)) {
            this._cars.set(carid, (await this.task.cars.getCarsById([carid]))[0])
        }
        return this._cars.get(carid) as Car
    }

    async lastRun(eventid: UUID, earliest: Date, classcodefilter?: string, coursefilter?: number) {
        return this.task.runs.getLastRun(eventid, earliest, classcodefilter, coursefilter)
    }

    async settings(): Promise<SeriesSettings> {
        if (!this._settings) {
            this._settings = await this.task.series.seriesSettings()
        }
        return this._settings
    }

    async classdata(): Promise<ClassData> {
        if (!this._classdata) {
            this._classdata = await this.task.clsidx.getClassData()
        }
        return this._classdata
    }

    async eresults(eventid: UUID): Promise<EventResults> {
        if (!this._eresults.has(eventid)) {
            // load and filter results
            const results = await this.task.results.getEventResults(eventid)
            for (const elist of Object.values(results)) {
                for (const e of elist) {
                    delete e.scca
                }
            }
            this._eresults[eventid] = results
        }
        return this._eresults[eventid]
    }

    async cresults(): Promise<ChampResults> {
        if (!this._cresults) {
            this._cresults = await this.task.results.getChampResults()
        }
        return this._cresults
    }

    async event(eventid: UUID, carids: UUID[], rungroupfilter?: number): Promise<[Entrant[], Entrant[]]> {
        const key = ['e', eventid, carids, rungroupfilter]
        if (!this._calculated.has(key)) {
            this._calculated.set(key, decorateClassResults(await this.settings(), await this.eresults(eventid), carids, rungroupfilter))
        }
        return this._calculated.get(key)
    }

    async champ(entrants: Entrant[]) {
        const key = ['c', entrants.map(e => e.driverid)]
        if (!this._calculated.has(key)) {
            this._calculated.set(key, decorateChampResults(await this.cresults(), entrants))
        }
        return this._calculated.get(key)
    }

    async nextorder(eventid: UUID, course: number, rungroup: number, aftercarid: UUID, classcodefilter?: string): Promise<Entrant[]> {
        // Get next carids in order and then match/return their results entries
        const key = ['n', eventid, course, rungroup, aftercarid]
        if (!this._calculated.has(key)) {
            const nextcars = await this.task.runs.getNextRunOrder(aftercarid, eventid, course, rungroup, classcodefilter)
            const order    = [] as Entrant[]
            const results  = await this.eresults(eventid)
            for (const n of nextcars) {
                const subkey = (n.classcode in results ? n.classcode : rungroup.toString())
                if (!(subkey in results)) continue

                for (const e of results[subkey]) {
                    if (e.carid === n.carid) {
                        e.bestrun = getBestNetRun(e, course)
                        order.push(e)
                        break
                    }
                }

            }
            this._calculated.set(key, order)
        }
        return this._calculated.get(key)
    }
}
