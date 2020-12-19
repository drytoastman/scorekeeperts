import http from 'http'
import WebSocket from 'ws'

import { UUID } from 'sctypes/util'
import { CookieSess } from './auth'
import { AUTHTYPE_DRIVER, AUTHTYPE_SERIES } from 'sctypes/auth'
import { LiveSocketWatch } from 'sctypes/results'
import { DefaultMap } from 'sctypes/data'

export interface SessionWebSocket extends WebSocket {
    driverid: UUID|null
    series: string|null
    eventid: UUID|null
    watch: LiveSocketWatch
}

export interface SessionMessage extends http.IncomingMessage {
   session: CookieSess
}

const EMPTY = new Set<SessionWebSocket>()
class AuthStore {
    drivers = new Set<SessionWebSocket>()
    series  = new Set<SessionWebSocket>()
    getSet(authtype: string): Set<SessionWebSocket> {
        switch (authtype) {
            case AUTHTYPE_DRIVER: return this.drivers
            case AUTHTYPE_SERIES: return this.series
        }
        return EMPTY
    }
}

export class TrackingServer extends WebSocket.Server {

    updates = new DefaultMap<string, AuthStore>(() => new AuthStore())
    live    = new Set<SessionWebSocket>()

    getUpdatesByAuth(series: string, authtype: string): Set<SessionWebSocket> {
        return this.updates.getD(series).getSet(authtype)
    }

    getUpdatesAllAuth(series: string): Array<SessionWebSocket> {
        const auth = this.updates.getD(series)
        return [...auth.getSet(AUTHTYPE_DRIVER), ...auth.getSet(AUTHTYPE_SERIES)]
    }

    addUpdate(series: string, authtype: string, ws: SessionWebSocket) {
        this.updates.getD(series).getSet(authtype).add(ws)
    }

    removeUpdate(series: string, authtype: string, ws: SessionWebSocket) {
        this.updates.getD(series).getSet(authtype).delete(ws)
    }

    addLive(ws: SessionWebSocket) {
        this.live.add(ws)
    }

    clearLive(ws: SessionWebSocket) {
        this.live.delete(ws)
    }

    getLiveItem(item: string): Array<SessionWebSocket> {
        return [...this.live.values()].filter(ws => ws.watch[item])
    }

    getLiveSeries(series: string): Array<SessionWebSocket> {
        return [...this.live.values()].filter(ws => ws.series === series)
    }

    getLive(series: string, item: string): Array<SessionWebSocket> {
        return [...this.live.values()].filter(ws => ws.series === series && ws.watch[item])
    }
}
