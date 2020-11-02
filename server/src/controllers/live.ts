import WebSocket from 'ws'
import { Request } from 'express'

import { tableWatcher } from '../db'
import { controllog } from '../util/logging'
import { CookieSess } from './auth'
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

// class SocketStore extends Map<string, AuthStore> {
class SessionServer extends WebSocket.Server {

    EMPTY = new Set<SessionWebSocket>()
    store = new Map<string, AuthStore>()

    getAll(series: string, authtype: string): Set<SessionWebSocket> {
        const auth = this.store.get(series)
        if (!auth) { return this.EMPTY }
        return auth.getSet(authtype)
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

/*
    store = new SocketStore()
} */

export function liveStart() {
    tableWatcher.addTables(['runs', 'timertimes', 'localeventstream', 'registered', 'events'])
}

export const live = new SessionServer({ noServer: true })
live.on('connection', function connection(ws: SessionWebSocket, req: Request) {
    ws.session     = req.session as CookieSess
    const series   = req.query.series as string
    const authtype = req.query.authtype as string

    if (!series || !authtype) {
        ws.close(1002, `No series (${series}) or authtype (${authtype}) provided`)
        return
    }

    live.put(series, authtype, ws)
    ws.onclose = () => {
        live.remove(series, authtype, ws)
    }
    ws.onmessage = () => {
        ws.send('pong')
    }
})

tableWatcher.on('registered', async function change() {
    try {
        /*
        const admin = live.getAll(series, AUTHTYPE_SERIES)
        if (admin.size > 0) {
            const res = await db.task('apiget', async t => {
                await t.series.setSeries(series)
                return t.register.getRegistationCounts()
            })
            const msg = JSON.stringify({
                type: 'update',
                series: series,
                counts: res
            })
            admin.forEach(function(ws) {
                ws.send(msg)
            })
        }
        */
    } catch (error) {
        controllog.error(error)
    }
})

tableWatcher.on('events', async function change(series: string, data: any) {
    try {
        const msg = JSON.stringify({
            type: 'update',
            series: series,
            events: [data]
        })
        // everybody gets basic event data
        live.clients.forEach(ws => ws.send(msg))
    } catch (error) {
        controllog.error(error)
    }
})
