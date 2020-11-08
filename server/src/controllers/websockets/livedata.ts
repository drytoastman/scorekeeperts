import { LiveSocketWatch, Run, TopTimesKey, watchNonTimers } from '@/common/results'
import { SeriesStatus } from '@/common/series'
import { UUID } from '@/common/util'
import { db, tableWatcher } from '@/db'
import { createTopTimesTable } from '@/db/results/calctoptimes'
import { getDObj } from '@/util/data'
import { websockets } from '.'
import { LazyData } from './lazydata'
import { SessionWebSocket } from './types'

export async function processLiveRequest(ws: SessionWebSocket, data: any) {
    console.log(data)
    websockets.clearLive(ws)

    if (await db.series.getStatus(data.series) !== SeriesStatus.ACTIVE) {
        return ws.send(JSON.stringify({ errors: ['not an active series'] }))
    }

    ws.watch  = data.watch
    ws.series = data.series
    ws.eventid = data.eventid
    websockets.addLive(ws)

    // fire off current data now
    if (ws.watch.protimer) ws.send(await generateProTimer())
    if (ws.watch.timer)    ws.send(await generateTimer(data.series))
    if (watchNonTimers(ws.watch)) doDataSend([ws], data.series, { eventid: data.eventid })
}

tableWatcher.on('timertimes', (series: string, type: string, row: any) => {
    const msg = JSON.stringify({ timer: row.raw })
    websockets.getLiveItem('timer').forEach(ws => ws.send(msg))
})

tableWatcher.on('localeventstream', (series: string) => {
    const rx = websockets.getLive(series, 'protimer')
    if (rx.length > 0) {
        const msg = generateProTimer()
        rx.forEach(ws => ws.send(msg))
    }
})

tableWatcher.on('runs', (series: string, type: string, row: any) => {
    const rx = websockets.getLiveSeries(series)
    if (rx.length <= 0) return
    doDataSend(rx, series, row)
})



async function doDataSend(rx: SessionWebSocket[], series: string, lastrun: any) {
    db.task(async t => {
        await t.series.setSeries(series)
        const lazy = new LazyData(t)
        for (const ws of rx) {
            if (lastrun.eventid !== ws.eventid) continue
            await sendNextResult(ws, lazy, lastrun)
        }
    }).catch(error => {
        console.log(error)
    })
}

async function generateTimer(series: string): Promise<string> {
    // only used on initial request
    return db.task(async t => {
        await t.series.setSeries(series)
        const row = await t.oneOrNone('SELECT raw FROM timertimes ORDER BY modified DESC LIMIT 1')
        if (row) return JSON.stringify({ timer: row.raw })
        return ''
    })
}

async function generateProTimer(): Promise<string> {
    const limit  = 30
    const events = await db.any('SELECT * FROM localeventstream ORDER BY time DESC LIMIT $1', [limit])

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


async function sendNextResult(ws: SessionWebSocket, lazy: LazyData, lastrun: Run): Promise<void> {
    let lastclasscode
    if (!lastrun.modified) {
        // if caller doesn't have a last run to base off of, find our own, still pass eventid this way
        const r = await lazy.lastRun(lastrun.eventid, new Date(0))
        if (!r) return
        lastrun = r
        lastclasscode = r.classcode
    } else {
        lastclasscode = (await lazy.getCar(lastrun.carid)).classcode
    }

    const event = await lazy.getEvent(lastrun.eventid)
    let data
    if (event.ispro) {
        //  Get the last run on the opposite course with the same classcode
        const back = new Date(lastrun.modified); back.setSeconds(-60)
        const opp  = await lazy.lastRun(lastrun.eventid, back, lastclasscode, lastrun.course === 1 ? 2 : 1)
        data = await loadEventResults(lazy, ws.watch, lastrun, opp ? opp.carid : undefined, lastclasscode)
    } else {
        data = await loadEventResults(lazy, ws.watch, lastrun)
    }

    data.timestamp = lastrun.modified
    ws.send(JSON.stringify(data))
}


/**
 * Load Event results based on the last run data
 * @param lazy the LazyData instance
 * @param watch the requested result items to watch for
 * @param lastrun the last run data
 * @param oppcarid optional carid to lookup on the opposite course (for ProSolo)
 */
async function loadEventResults(lazy: LazyData, watch: LiveSocketWatch, lastrun: Run, oppcarid?:UUID, classcodefilter?: string) {
    const data      = {} as any
    const carids    = [lastrun.carid]

    if (oppcarid) carids.push(oppcarid)
    data.last = await loadEntrantResults(lazy, watch, lastrun.eventid, carids, lastrun.rungroup)

    for (const type in watch.top) {
        getDObj(data, 'top')[type] = {}
        for (const course in watch.top[type]) {
            if (watch.top[type][course]) {
                data.top[type][course] = createTopTimesTable(
                    await lazy.classdata(),
                    await lazy.eresults(lastrun.eventid),
                    [new TopTimesKey({ indexed: type === 'net', counted: type === 'net', course: course })],
                    lastrun.carid
                )
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
            data.next = await loadEntrantResults(lazy, watch, lastrun.eventid, [nextids[0].carid], lastrun.rungroup)
        }
    }

    return data
}

async function loadEntrantResults(lazy: LazyData, watch: LiveSocketWatch, eventid: UUID, carids: UUID[], rungroupfilter?: number) {
    const ret = {} as any
    if (!carids || carids.length <= 0) return ret

    const [group, drivers] = await lazy.event(eventid, carids, rungroupfilter)
    if (!drivers) return ret

    const classcode = drivers[0].classcode

    if (watch.entrant) ret.entrant = drivers[0]
    if (watch.class)   ret.class   = { classcode: classcode, order: group }
    if (watch.champ && !(await lazy.getEvent(eventid)).ispractice && (await lazy.classdata()).classlist[classcode].champtrophy) {
        ret.champ = {
            classcode: classcode,
            order: await lazy.champ(drivers)
        }
    }

    return ret
}
