import querystring from 'querystring'

import { db, tableWatcher } from '../db'
import { controllog } from '../util/logging'
import { AuthData } from './auth'
import { AUTHTYPE_DRIVER, AUTHTYPE_SERIES } from '@/common/auth'
import { SessionMessage, SessionWebSocket, TrackingServer } from './types'
import { Run, watchDifference, watchNonTimers } from '@/common/results'
import { SeriesStatus } from '@/common/series'
import { generateProTimer, loadResultData } from './gets/livedata'
import { LazyData } from './lazydata'
import { IS_MAIN_SERVER } from '@/db/generalrepo'


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
        ws.onclose   = (event) => websockets.removeUpdate(series, authtype, ws)
        websockets.addUpdate(series, authtype, ws)


    } else if (pathname === '/api2/live') {
        if (await db.general.isMainServer()) {
            return ws.close(1002, 'Available onsite only')
        }
        ws.series    = ''
        ws.eventid   = ''
        ws.watch     = {} as any
        ws.onmessage = (e) => processLiveRequest(ws, JSON.parse(e.data.toString()))
        ws.onclose   = ()  => websockets.clearLive(ws)
        websockets.addLive(ws)

    } else {
        return ws.close(1002, 'Unknown endpoint')
    }
})

async function processLiveRequest(ws: SessionWebSocket, data: any) {
    if (await db.series.getStatus(data.series) !== SeriesStatus.ACTIVE) {
        return ws.send(JSON.stringify({ errors: ['not an active series'] }))
    }
    ws.watch   = data.watch
    ws.series  = data.series
    ws.eventid = data.eventid
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

tableWatcher.on('runs', (series: string, type: string, row: Run&{classcode:string}) => {
    const rx = websockets.getLiveSeries(series)
    if (rx.length <= 0) return
    db.task(async t => {
        await t.series.setSeries(series)
        const lazy = new LazyData(t)

        for (const ws of rx) {
            if (row.eventid !== ws.eventid) continue
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
            const msg = JSON.stringify({ type: type, series: series, [tbl]: [row] })
            websockets.getUpdatesAllAuth(series).forEach(ws => ws.send(msg))
        } catch (error) {
            controllog.error(error)
        }
    })
}

// for registered, counts can go to everybody, rest is specifi
tableWatcher.on('registered', async function change(series: string, type: string, row: any) {
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

