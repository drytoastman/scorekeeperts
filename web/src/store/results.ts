import axios from 'axios'
import Vue from 'vue'

import { AUTHTYPE_NONE } from '@sctypes/auth'
import { DefaultMap } from '@sctypes/data'
import { SeriesEvent } from '@sctypes/event'
import { LiveSocketWatch } from '@sctypes/results'
import { UUID } from '@sctypes/util'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { ActionContext, ActionTree, GetterTree, MutationTree } from 'vuex'
import { API2, Api2State } from './state'
import { Challenge } from '@sctypes/challenge'


export const resultsMutations: MutationTree<Api2State> = {

    setWebSocket(state: Api2State, ws: ReconnectingWebSocket) { state.websocket = ws },
    setEvent(state: Api2State, eventid: UUID)          { state.live.eventid = eventid },
    setWatch(state: Api2State, watch: LiveSocketWatch) { state.live.watch = watch },

    setGetClass(state: Api2State, classcode: string) {
        state.live.lastclass = undefined
        state.live.getclass = classcode
    },

    setSeriesEvent(state: Api2State, param: any) {
        state.live.eventid = param.eventid
    },

    processLiveData(state: Api2State, data: any) {
        if (data.last) {
            state.live.prev = state.live.last
            state.live.last = data.last
            if (data.last.entrant?.classcode === state.live.getclass) {
                state.live.lastclass = data.last
            }
            if (data.last.entrant.lastcourse > 1) {
                state.live.right = data.last
            } else {
                state.live.left = data.last
            }
        }
        if (data.next)     { state.live.next     = data.next }
        if (data.timer)    { state.live.timer    = data.timer }
        if (data.runorder) {
            state.live.runorder = data.runorder
            if (data.last?.entrant.lastcourse > 1) {
                state.live.rightorder = data.runorder
            } else {
                state.live.leftorder = data.runorder
            }
        }
        if (data.protimer) {
            state.live.lefttimer  = data.protimer.left
            state.live.righttimer = data.protimer.right
        }
        if (data.top) {
            if (data.top.net) { state.live.topnet = data.top.net[0] }
            if (data.top.raw) { state.live.topraw = data.top.raw[0] }
        }
        if (data.classes) {
            state.classes = {}
            data.classes.forEach(v => Vue.set(state.classes, v.classcode, v))
        }
    },

    processNoClassData(state: Api2State) {
        state.live.prev = { nodata: 'nodata' }
        state.live.last = { nodata: 'nodata' }
        state.live.next = { nodata: 'nodata' }
    },

    processLastClass(state: Api2State, data: any) {
        if (!data) {
            state.live.lastclass = undefined
        } else if (data.last) {
            state.live.lastclass = data.last
        } else if (data) {
            state.live.lastclass = { nodata: 'no data' }
        }
    }
}

export const resultsActions: ActionTree<Api2State, any> = {

    newRouteParam(context: ActionContext<Api2State, any>, params: any): void {
        if ((context.state.currentSeries !== params.series) || (context.state.live.eventid !== params.eventid)) {
            context.commit('setSeriesEvent', params)
        }
    },

    setWatch(context: ActionContext<Api2State, any>, data: LiveSocketWatch): void {
        context.commit('setWatch', data)
        if (!context.state.websocket) {
            context.dispatch('_restartWebSocket')
        } else {
            context.dispatch('_sendWatchRequest')
        }
    },

    setClass(context: ActionContext<Api2State, any>, classcode: string): void {
        context.commit('setGetClass', classcode)

        const p = {
            authtype: AUTHTYPE_NONE,
            series: context.state.currentSeries,
            eventid: context.state.live.eventid,
            items: 'live',
            watch: {
                entrant: context.state.live.watch?.entrant,
                class: context.state.live.watch?.class,
                champ: context.state.live.watch?.class,
                classcode: classcode
            }
        }

        axios.get(API2.ROOT, { params: p, withCredentials: true }).then(res => {
            context.commit('processLastClass', res.data)
        }).catch(error => {
            context.commit('addErrors', [error.toString()])
        })
    },

    _restartWebSocket(context: ActionContext<Api2State, any>): void {
        /* Create our websocket handler and default get request */
        if (context.state.websocket) {
            context.state.websocket.close()
        }

        let prefix = 'ws:'
        if (window.location.protocol === 'https:') prefix = 'wss:'
        const ws = new ReconnectingWebSocket(`${prefix}//${window.location.host}${API2.LIVE}`, undefined, {
            minReconnectionDelay: 1000,
            maxRetries: 100,
            startClosed: true
        })

        ws.onopen    = ()  => { context.dispatch('_sendWatchRequest') }
        ws.onmessage = (e) => { context.commit('processLiveData', JSON.parse(e.data)) }
        ws.onclose   = (e) => { if (e.code >= 1002 && e.reason) context.commit('addErrors', [`Websocket: ${e.reason}`]) }
        ws.onerror   = (e) => { if (e.error && e.error.message !== 'TIMEOUT') context.commit('addErrors', [`Websocket: ${e.error.message}`]) }
        ws.reconnect()

        context.commit('setWebSocket', ws)
    },

    _sendWatchRequest(context: ActionContext<Api2State, any>): void {
        if (!context.state.websocket || !context.state.live.watch) return

        context.state.websocket.send(JSON.stringify({
            series: context.state.currentSeries,
            eventid: context.state.live.eventid,
            watch: context.state.live.watch
        }))

        // When changing send a direct request to get latest data rather than waiting for next run
        const p = {
            authtype: AUTHTYPE_NONE,
            series: context.state.currentSeries,
            eventid: context.state.live.eventid,
            items: 'live,classes',
            watch: context.state.live.watch
        }

        axios.get(API2.ROOT, { params: p, withCredentials: true }).then(res => {
            context.commit(res.data.last ? 'processLiveData' : 'processNoClassData', res.data)
        }).catch(error => {
            context.commit('addErrors', [error.toString()])
        })
    }
}

const yearMatch = /\d{2}$/
export function seriesYear(series: string): string {
    const m = yearMatch.exec(series)
    return m ? '20' + m[0] : 'Other'
}

export const resultsGetters: GetterTree<Api2State, Api2State> = {
    yearGroups: (state): DefaultMap<string, string[]> => {
        const years = new DefaultMap<string, string[]>(() => [])
        for (const s of state.allseries) {
            years.getD(seriesYear(s)).push(s)
        }
        return years
    },

    eventInfo: (state) => (eventid: UUID) => {
        if (!state.seriesinfo.events) return {}
        const e = state.seriesinfo.events.filter((e: SeriesEvent) => e.eventid === eventid)
        if (e.length) return e[0]
        return {}
    },

    challengeInfo: (state) => (challengeid: UUID) => {
        if (!state.seriesinfo.challenges) return {}
        const e = state.seriesinfo.challenges.filter((c: Challenge) => c.challengeid === challengeid)
        if (e.length) return e[0]
        return {}
    },

    resultsClasses: (state): string[] => {
        return Object.keys(state.eventresults).filter(c => c !== '_eventid').sort()
    },

    resultsEvent: (state, getters): string[] => {
        return getters.eventInfo(state.eventresults._eventid)
    },

    classesForGroups: (state) => (groups: number[]) => {
        const codes = new Set<string>()
        for (const [code, res] of Object.entries(state.eventresults)) {
            for (const e of res as any[]) {
                if (groups.includes(e.rungroup)) {
                    codes.add(code)
                    break
                }
            }
        }
        return [...codes]
    }
}
