import { ClassData } from '@/common/classindex'
import { SeriesEvent } from '@/common/event'
import { ChampResults, Entrant, EventResults, Run, TopTimesKey } from '@/common/results'
import { SeriesStatus } from '@/common/series'
import { SeriesSettings } from '@/common/settings'
import { UUID } from '@/common/util'
import { db, ScorekeeperProtocol, tableWatcher } from '@/db'
import { loadTopTimesTable } from '@/db/results/calctoptimes'
import { decorateChampResults, decorateClassResults, getBestNetRun } from '@/db/results/decorate'
import { websockets } from '.'
import { SessionWebSocket, WebSocketWatch } from './types'

export async function processLiveRequest(ws: SessionWebSocket, data: any) {
    websockets.clearLive(ws)
    if (await db.series.getStatus(data.series) !== SeriesStatus.ACTIVE) {
        return ws.send(JSON.stringify({ error: 'not an active series' }))
    }

    ws.watch  = data.watch
    ws.series = data.series
    ws.lastresulttime = new Date(0)
    websockets.addLive(ws)

    // fire off current data now!
    if (ws.watch.protimer) ws.send(generateProTimer(data.series))
}


tableWatcher.on('timertimes', (series: string, type: string, row: any) => {
    const msg = JSON.stringify({ timer: row.raw })
    websockets.getAllLive('timer').forEach(ws => ws.send(msg))
})

tableWatcher.on('localeventstream', (series: string, type: string, row: any) => {
    const rx = websockets.getLive(series, 'protimer')
    if (rx.length > 0) {
        const msg = generateProTimer(series)
        rx.forEach(ws => ws.send(msg))
    }
})

tableWatcher.on('runs', (series: string, type: string, row: any) => {
    const rx = websockets.getLive(series, 'everything else?')
    if (rx.length <= 0) return
    db.task(async t => {
        await t.series.setSeries(series)
        const lazy = new LazyData(t)
        rx.forEach(async ws => await sendNextResult(ws, lazy, row))
    })
})


async function generateProTimer(series: string): Promise<string> {
    const limit  = 30
    const events = await db.task(async t => {
        await t.series.setSeries(series)
        return await t.any('SELECT * FROM localeventstream ORDER BY time DESC LIMIT $1', [limit])
    })

    if (!events) return ''
    events.reverse()

    const record = [[] as any[], [] as any[]]
    for (const ev of events) {
        if (ev.etype === 'TREE') {
            record[0].push({})
            record[1].push({})

        } else if (ev.etype === 'RUN') {
            const d = ev.event.data
            const fmt = {
                rowid:    d.rowid,
                reaction: d.attr.reaction || '',
                sixty:    d.attr.sixty || '',
                status:   d.status || '',
                raw:      d.raw || 'NaN'
            }

            const cindex = d.course - 1
            let found = false
            for (const r of record[cindex])  {
                if (r.rowid === fmt.rowid) {
                    Object.assign(r, fmt)
                    found = true
                    break
                }
            }

            if (!found && record[cindex].length > 0) {
                const lidx = record[cindex].length - 1
                const last = record[cindex][lidx]
                Object.assign(last, fmt)
            }
        }
    }

    return JSON.stringify({
        protimer: {
            left:  record[0].slice(-3),
            right: record[1].slice(-3)
        }
    })
}


async function sendNextResult(ws: SessionWebSocket, lazy: LazyData, lastrun: Run, lastclasscode?: string) {
    let data
    if ((await lazy.getEvent(lastrun.eventid)).ispro) {
        //  Get the last run on the opposite course with the same classcode
        const back  = new Date(ws.lastresulttime)
        back.setSeconds(-60)
        const opp = await lazy.lastRuns(lastrun.eventid, back, lastclasscode, lastrun.course === 1 ? 2 : 1)
        data = await loadEventResults(lazy, ws.watch, lastrun, opp ? opp.lastEntry.carid : undefined, lastclasscode)
    } else {
        data = await loadEventResults(lazy, ws.watch, lastrun)
    }

    data.timestamp = lastrun.modified
    return [data, lastrun.modified]
}

/**
 * Load Event results based on the last run data
 * @param lazy the LazyData instance
 * @param watch the requested result items to watch for
 * @param lastrun the last run data
 * @param oppcarid optional carid to lookup on the opposite course (for ProSolo)
 */
async function loadEventResults(lazy: LazyData, watch: WebSocketWatch, lastrun: Run, oppcarid?:UUID, classcodefilter?: string) {
    const data      = {} as any
    const carids    = [lastrun.carid]

    if (oppcarid) carids.push(oppcarid)
    data.last  = loadEntrantResults(lazy, watch, lastrun.eventid, carids, lastrun.rungroup)

    for (const type of ['net', 'raw']) {
        for (const side of ['', 'left', 'right']) {
            const key = `top${type}${side}`
            if (watch[key]) {
                const cd  = await lazy.classdata()
                const er  = await lazy.eresults(lastrun.eventid)
                const cc  = side === 'left' ? 1 : (side === 'right' ? 2 : 0)
                const tt  = new TopTimesKey({ indexed: type === 'net', counted: type === 'net', course: cc })
                data[key] = loadTopTimesTable(cd, er, [tt], lastrun.carid)
            }
        }
    }

    if (watch.runorder) {
        data.runorder =  {
            course: lastrun.course,
            run: lastrun.run,
            next: await lazy.nextorder(lastrun.eventid, lastrun.course, lastrun.rungroup, lastrun.carid)
        }
    }

    if (watch.next) {
        const nextids = await lazy.nextorder(lastrun.eventid, lastrun.course, lastrun.rungroup, lastrun.carid, classcodefilter)
        if (nextids && nextids.length) {
            data.next = loadEntrantResults(lazy, watch, lastrun.eventid, [nextids[0].carid], lastrun.rungroup)
        }
    }

    return data
}

async function loadEntrantResults(lazy: LazyData, watch: WebSocketWatch, eventid: UUID, carids: UUID[], rungroupfilter?: number) {
    const ret = {} as any
    if (!carids || carids.length <= 0) return ret

    const [group, drivers] = await lazy.event(eventid, carids, rungroupfilter)
    if (!drivers) return ret

    const classcode = drivers[0].classcode

    if (watch.entrant) ret.entrant = drivers[0]

    if (watch.class) ret.class = { classcode:classcode, order: group }

    if (watch.champ && !(await lazy.getEvent(eventid)).ispractice && (await lazy.classdata()).classlist[classcode].champtrophy) {
        ret.champ = { classcode:classcode, order: await lazy.champ(drivers) }
    }

    return ret
}


class LazyData {

    _events:     Map<UUID, SeriesEvent> = new Map()
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

    async lastRuns(eventid: UUID, earliest: Date, classcodefilter?: string, coursefilter?: number) {
        return await this.task.runs.getLastSet(eventid, earliest, classcodefilter, coursefilter)
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
            const results  = this.eresults(eventid)
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
