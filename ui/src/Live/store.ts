import axios from 'axios'

import Vuex, { ActionContext, ActionTree, MutationTree, Store } from 'vuex'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { LiveSocketWatch } from '@/common/results'
import Vue from 'vue'
import { API2 } from '@/store/state'
import { UUID } from '@/common/util'
import { AUTHTYPE_NONE } from '@/common/auth'
import { SeriesClass } from '@/common/classindex'

class LiveState {
    websocket:  ReconnectingWebSocket | undefined = undefined

    errors     = [] as string[]
    infos      = [] as string[]
    serieslist = [] as string[]
    classes    = [] as SeriesClass[]
    series     = ''
    eventid    = ''
    getclass   = ''
    watch: LiveSocketWatch|undefined = undefined

    prev: any = {}
    last: any = {}
    next: any = {}
    lastclass: any = { nodata: 'no data' }
    topnet: any = {}
    topraw: any = {}
    runorder: any = {}
    timer = 0
}

const livemutations: MutationTree<LiveState> = {

    clearInfos() { /* nothing to do in this store */ },
    clearErrors(state: LiveState) { state.errors = [] },
    setWebSocket(state: LiveState, ws: ReconnectingWebSocket) { state.websocket = ws },
    setEvent(state: LiveState, eventid: UUID) { state.eventid = eventid },
    setWatch(state: LiveState, watch: LiveSocketWatch) { state.watch = watch },

    setGetClass(state: LiveState, classcode: string) {
        state.lastclass = undefined
        state.getclass = classcode
    },

    setSeriesEvent(state: LiveState, param: any) {
        state.series  = param.series
        state.eventid = param.eventid
    },

    addErrors(state: LiveState, errors: string[]) {
        state.errors = [...state.errors, ...errors]
        if (state.errors.length > 10) {
            state.errors.splice(0, state.errors.length - 10)
        }
    },

    processData(state: LiveState, data: any) {
        if (data.last) {
            state.prev = state.last
            state.last = data.last
            if (data.last.entrant?.classcode === state.getclass) {
                state.lastclass = data.last
            }
        }
        if (data.next)     { state.next     = data.next }
        if (data.timer)    { state.timer    = data.timer }
        if (data.runorder) { state.runorder = data.runorder }
        if (data.top) {
            if (data.top.net) { state.topnet = data.top.net[0] }
            if (data.top.raw) { state.topraw = data.top.raw[0] }
        }
        if (data.classes) {
            state.classes = data.classes
        }
    },

    processLastClass(state: LiveState, data: any) {
        if (!data) {
            state.lastclass = undefined
        } else if (data.last) {
            state.lastclass = data.last
        } else if (data) {
            state.lastclass = { nodata: 'no data' }
        }
    }
}

const liveactions: ActionTree<LiveState, any> = {

    newRouteParam(context: ActionContext<LiveState, any>, params: any): void {
        if ((context.state.series !== params.series) || (context.state.eventid !== params.eventid)) {
            context.commit('setSeriesEvent', params)
        }
    },

    setWatch(context: ActionContext<LiveState, any>, data: LiveSocketWatch): void {
        context.commit('setWatch', data)
        if (!context.state.websocket) {
            context.dispatch('_restartWebSocket')
        } else {
            context.dispatch('_sendRequest')
        }
    },

    setClass(context: ActionContext<LiveState, any>, classcode: string): void {
        context.commit('setGetClass', classcode)

        const p = {
            authtype: AUTHTYPE_NONE,
            series: context.state.series,
            eventid: context.state.eventid,
            items: 'live',
            watch: {
                entrant: context.state.watch?.entrant,
                class: context.state.watch?.class,
                champ: context.state.watch?.class,
                classcode: classcode
            }
        }

        axios.get(API2.ROOT, { params: p, withCredentials: true }).then(res => {
            context.commit('processLastClass', res.data)
        }).catch(error => {
            context.commit('addErrors', [error.toString()])
        })
    },

    _restartWebSocket(context: ActionContext<LiveState, any>): void {
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

        ws.onopen    = ()  => { context.dispatch('_sendRequest') }
        ws.onmessage = (e) => { context.commit('processData', JSON.parse(e.data)) }
        ws.onclose   = (e) => { if (e.code >= 1002 && e.reason) context.commit('addErrors', [`Websocket: ${e.reason}`]) }
        ws.onerror   = (e) => { if (e.error && e.error.message !== 'TIMEOUT') context.commit('addErrors', [`Websocket: ${e.error.message}`]) }
        ws.reconnect()

        context.commit('setWebSocket', ws)
    },

    _sendRequest(context: ActionContext<LiveState, any>): void {
        if (!context.state.websocket || !context.state.watch) return

        context.state.websocket.send(JSON.stringify({
            series: context.state.series,
            eventid: context.state.eventid,
            watch: context.state.watch
        }))

        // When changing send a direct request to get latest data rather than waiting for next run
        const p = {
            authtype: AUTHTYPE_NONE,
            series: context.state.series,
            eventid: context.state.eventid,
            items: 'live,classes',
            watch: context.state.watch
        }

        axios.get(API2.ROOT, { params: p, withCredentials: true }).then(res => {
            context.commit('processData', res.data)
        }).catch(error => {
            context.commit('addErrors', [error.toString()])
        })
    }
}

Vue.use(Vuex)
export default new Store({
    state:     new LiveState(),
    mutations: livemutations,
    actions:   liveactions
})
