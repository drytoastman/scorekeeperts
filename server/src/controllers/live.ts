import WebSocket from 'ws'
import { Request } from 'express'

import { db, tableWatcher } from '../db'
import { controllog } from '../util/logging'
import { AuthData, CookieSess } from './auth'
import { AUTHTYPE_DRIVER, AUTHTYPE_SERIES } from '@/common/auth'

interface SessionWebSocket extends WebSocket {
    session: CookieSess
}

class AuthStore {
    drivers = new Set<SessionWebSocket>()
    series  = new Set<SessionWebSocket>()
    unauth  = new Set<SessionWebSocket>()

    getSet(authtype: string): Set<SessionWebSocket> {
        switch (authtype) {
            case AUTHTYPE_DRIVER: return this.drivers
            case AUTHTYPE_SERIES: return this.series
        }
        return this.unauth
    }
}

class SessionServer extends WebSocket.Server {

    EMPTY = new Set<SessionWebSocket>()
    store = new Map<string, AuthStore>()

    getSeriesByAuth(series: string, authtype: string): Set<SessionWebSocket> {
        const auth = this.store.get(series)
        if (!auth) { return this.EMPTY }
        return auth.getSet(authtype)
    }

    getSeriesAllAuth(series: string): Array<SessionWebSocket> {
        const auth = this.store.get(series)
        if (!auth) { return [] }
        return [...auth.getSet(AUTHTYPE_DRIVER), ...auth.getSet(AUTHTYPE_SERIES)]
    }

    put(series: string, authtype: string, ws: SessionWebSocket) {
        let auth = this.store.get(series)
        if (!auth) {
            auth = new AuthStore()
            this.store.set(series, auth)
        }
        auth.getSet(authtype).add(ws)
    }

    remove(series: string, authtype: string, ws: SessionWebSocket) {
        const auth = this.store.get(series)
        if (!auth) return
        auth.getSet(authtype).delete(ws)
    }
}

async function allsend(series: string, type: string, data: any) {
    try {
        const msg = JSON.stringify(Object.assign({ type: type, series: series }, data))
        live.clients.forEach(ws => ws.send(msg))
    } catch (error) {
        controllog.error(error)
    }
}

// 'runs', 'timertimes', 'localeventstream'
export function liveStart() {
    tableWatcher.addTables(['registered', 'events', 'itemeventmap', 'paymentitems', 'paymentaccounts'])
}

for (const tbl of ['events', 'itemeventmap', 'paymentitems', 'paymentaccounts']) {
    tableWatcher.on(tbl, (series, type, row) => allsend(series, type, { [tbl]: [row] }))
}

export const live = new SessionServer({ noServer: true })
live.on('connection', async function connection(ws: SessionWebSocket, req: Request) {
    ws.session     = req.session as CookieSess
    const series   = req.query.series as string
    const authtype = req.query.authtype as string
    const ismain   = await db.general.isMainServer()
    const auth     = new AuthData(req.session as any)

    if (!series || !authtype) {
        ws.close(1002, `No series (${series}) or authtype (${authtype}) provided`)
        return
    }

    if (ismain && !auth.hasAnyAuth()) {
        ws.close(1002, 'Not authenticated for main server')
    }

    live.put(series, authtype, ws)
    ws.onclose   = () => live.remove(series, authtype, ws)
    ws.onmessage = () => ws.send('hello')
})

tableWatcher.on('registered', async function change(series: string, type: string, row: any) {
    try {
        const auth = live.getSeriesAllAuth(series)
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
