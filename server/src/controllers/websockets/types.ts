import http from 'http'
import WebSocket from 'ws'

import { UUID } from '@/common/util'
import { CookieSess } from '../auth'
import { AUTHTYPE_DRIVER, AUTHTYPE_SERIES } from '@/common/auth'


export interface SessionWebSocket extends WebSocket {
    driverid: UUID|null
    series: string|null
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

    updates = new Map<string, AuthStore>()
    live    = new Map<string, Set<SessionWebSocket>>()

    getUpdatesByAuth(series: string, authtype: string): Array<SessionWebSocket> {
        const auth = this.updates.get(series)
        if (!auth) { return [] }
        return [...auth.getSet(authtype)]
    }

    getUpdatesAllAuth(series: string): Array<SessionWebSocket> {
        const auth = this.updates.get(series)
        if (!auth) { return [] }
        return [...auth.getSet(AUTHTYPE_DRIVER), ...auth.getSet(AUTHTYPE_SERIES)]
    }

    addUpdate(series: string, authtype: string, ws: SessionWebSocket) {
        let auths = this.updates.get(series)
        if (!auths) {
            auths = new AuthStore()
            this.updates.set(series, auths)
        }
        auths.getSet(authtype).add(ws)
    }

    removeUpdate(series: string, authtype: string, ws: SessionWebSocket) {
        const auths = this.updates.get(series)
        if (!auths) return
        auths.getSet(authtype).delete(ws)
    }

    addLive(series: string, ws: SessionWebSocket) {

    }

    removeLive(series: string, ws: SessionWebSocket) {
    }
}
