import querystring from 'querystring'

import { db, tableWatcher } from 'scdb'
import { controllog } from '../util/logging'
import { AuthData } from './auth'
import { AUTHTYPE_DRIVER, AUTHTYPE_SERIES } from 'sctypes/auth'
import { SessionMessage, SessionWebSocket, TrackingServer } from './types'
import { Run, watchNonTimers } from 'sctypes/results'
import { SeriesStatus } from 'sctypes/series'
import { generateProTimer, loadResultData } from './gets/livedata'
import { LazyData } from './lazydata'


export function websocketsStartWatching() {
    tableWatcher.addTables(['registered', 'events', 'itemeventmap', 'paymentitems', 'paymentaccounts', 'runs', 'timertimes', 'localeventstream'])
}

export const websockets = new TrackingServer({ noServer: true })

websockets.on('connection', async function connection(ws: SessionWebSocket, req: SessionMessage) {
    ws.onerror = (error) => controllog.error(error)

    if (!req.url) {
        ws.close(1002, 'No url, how?')
        return
    }

    const [pathname, q] = req.url.split('?')
    const query    = querystring.parse(q)
    const series   = query.series as string
    const authtype = query.authtype as string

    if (pathname === '/api2/updates') {
        if (!series) {
            ws.close(1002, 'Invalid series provided')
            return
        }

        const auth = new AuthData(req.session)
        switch (authtype) {
            case AUTHTYPE_DRIVER:
                if (!auth.hasDriverAuth()) return ws.close(1002, 'Not driver authenticated for updates')
                ws.driverid = auth.driverId()
                break
            case AUTHTYPE_SERIES:
                if (!auth.hasSeriesAuth(series)) return ws.close(1002, 'Not series authenticated for updates')
                ws.series = series
                break
            default:
                return ws.close(1002, 'No authtype provided for updates')
        }
        ws.onclose   = () => websockets.removeUpdate(series, authtype, ws)
        websockets.addUpdate(series, authtype, ws)


    } else if (pathname === '/api2/live') {
        ws.series    = ''
        ws.eventid   = ''
        ws.watch     = {} as any
        ws.onmessage = (e) => processLiveRequest(ws, JSON.parse(e.data.toString()))
        ws.onclose   = ()  => websockets.clearLive(ws)
        websockets.addLive(ws)

        // must be done after onmessage is set so any socket receives are processed
        if (await db.general.isMainServer()) {
            ws.close(1002, 'Available onsite only')
        }
    } else {
        return ws.close(1002, 'Unknown endpoint')
    }
})

async function processLiveRequest(ws: SessionWebSocket, data: any) {
    db.task(async task => {
        task.series.setSeries(data.series)
        if (await task.series.getStatus(data.series) !== SeriesStatus.ACTIVE) {
            return ws.send(JSON.stringify({ errors: ['not an active series'] }))
        }
        ws.watch   = data.watch
        ws.series  = data.series
        ws.eventid = await task.events.getEventidForSlug(data.eventid)
    })
}

tableWatcher.on('timertimes', (series: string, type: string, row: any) => {
    const msg = JSON.stringify({ timer: row.raw })
    websockets.getLiveItem('timer').forEach(ws => ws.send(msg))
})

tableWatcher.on('localeventstream', async () => {
    const rx = websockets.getLiveItem('protimer')
    if (rx.length > 0) {
        const msg = await generateProTimer()
        rx.forEach(ws => ws.send(JSON.stringify(msg)))
    }
})

tableWatcher.on('runs', (series: string, type: string, row: Run&{classcode:string}) => {
    const rx = websockets.getLiveSeries(series)
    if (rx.length <= 0) return
    db.task(async t => {
        await t.series.setSeries(series)
        const lazy = new LazyData(t)

        for (const ws of rx) {
            if (row.eventid !== ws.eventid) continue
            if (ws.watch.course && ws.watch.course !== row.course) continue
            if (!watchNonTimers(ws.watch))  continue
            ws.send(JSON.stringify(await loadResultData(lazy, ws.watch, row)))
        }
    }).catch(error => {
        controllog.log(error)
    })
})


// these general updates can go to any authenticated users
for (const tbl of ['events', 'itemeventmap', 'paymentitems', 'paymentaccounts']) {
    tableWatcher.on(tbl, (series, type, row) => {
        try {
            for (const key of ['modified', 'created', 'regclosed', 'regopened']) {
                if (key in row) {
                    row[key] += 'Z' // force readers to see it as UTC
                }
            }
            const msg = JSON.stringify({ type: type, series: series, [tbl]: [row] })
            websockets.getUpdatesAllAuth(series).forEach(ws => ws.send(msg))
        } catch (error) {
            controllog.error(error)
        }
    })
}

// for registered, counts can go to everybody, rest is specific  (series, type, row)
tableWatcher.on('registered', async function change(series: string) {
    try {
        const auth = websockets.getUpdatesAllAuth(series)
        if (auth.length > 0) {
            const msg = await db.task('apiget', async t => {
                await  t.series.setSeries(series)
                return JSON.stringify({
                    type:   'get',
                    series: series,
                    counts: await t.register.getRegistationCounts()
                })
            })
            auth.forEach(ws => ws.send(msg))
        }
    } catch (error) {
        controllog.error(error)
    }
})

