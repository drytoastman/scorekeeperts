import querystring from 'querystring'

import { db, tableWatcher } from '../../db'
import { controllog } from '../../util/logging'
import { AuthData } from '../auth'
import { AUTHTYPE_DRIVER, AUTHTYPE_NONE, AUTHTYPE_SERIES } from '@/common/auth'
import { SessionMessage, SessionWebSocket, TrackingServer } from './types'
import { processLiveRequest } from './livedata'


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

