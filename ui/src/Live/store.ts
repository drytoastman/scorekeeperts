import Vuex, { ActionContext, ActionTree, MutationTree, Store } from 'vuex'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { LiveSocketWatch } from '@/common/results'
import Vue from 'vue'
import { API2 } from '@/store/state'
import { UUID } from '@/common/util'

class LiveState {
    websocket:  ReconnectingWebSocket | undefined = undefined

    errors         = [] as string[]
    infos          = [] as string[]
    serieslist     = [] as string[]
    series         = ''
    eventid        = ''
    requestData    = new LiveSocketWatch()

    prev: any = {}
    last: any = {}
    next: any = {}
    topnet: any = {}
    topraw: any = {}
    runorder: any = {}
    timer = 0
}

const livemutations: MutationTree<LiveState> = {
    addErrors(state: LiveState, errors: string[]) {
        state.errors = [...state.errors, ...errors]
        if (state.errors.length > 10) {
            state.errors.splice(0, state.errors.length - 10)
        }
    },

    clearErrors(state: LiveState) {
        state.errors = []
    },

    processData(state: LiveState, data: any) {
        if (data.last) {
            state.prev = state.last
            state.last = data.last
        }
        if (data.next)     { state.next     = data.next }
        if (data.timer)    { state.timer    = data.timer }
        if (data.runorder) { state.runorder = data.runorder }
        if (data.top) {
            if (data.top.net) { state.topnet = data.top.net[0] }
            if (data.top.raw) { state.topraw = data.top.raw[0] }
        }
    },

    setWebSocket(state: LiveState, ws: ReconnectingWebSocket) {
        state.websocket = ws
    },

    setSeries(state: LiveState, series: string) {
        state.series = series
    },

    setEvent(state: LiveState, eventid: UUID) {
        state.eventid = eventid
    }
}

const liveactions: ActionTree<LiveState, any> = {

    newRouteParam(context: ActionContext<LiveState, any>, params: any): void {
        if ((context.state.series !== params.series) || (context.state.eventid !== params.eventid)) {
            context.commit('setSeries', params.series)
            context.commit('setEvent',  params.eventid)
            context.dispatch('restartWebSocket')
        }
    },

    restartWebSocket(context: ActionContext<LiveState, any>): void {
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

        ws.onopen    = ()  => { context.dispatch('sendRequest') }
        ws.onmessage = (e) => { context.commit('processData', JSON.parse(e.data)) }
        ws.onclose   = (e) => { if (e.code >= 1002 && e.reason) context.commit('addErrors', [`Websocket: ${e.reason}`]) }
        ws.onerror   = (e) => { if (e.error && e.error.message !== 'TIMEOUT') context.commit('addErrors', [`Websocket: ${e.error.message}`]) }
        ws.reconnect()

        context.commit('setWebSocket', ws)
    },

    sendRequest(context: ActionContext<LiveState, any>): void {
        if (!context.state.websocket) return
        context.state.websocket.send(JSON.stringify({
            series:  context.state.series,
            eventid: context.state.eventid,
            watch: {
                timer:    true,
                runorder: true,
                entrant:  true,
                class:    true,
                // champ:    true,
                next:     true,
                top: {
                    net:  { 0: true },
                    raw:  { 0: true }
                }
            }
        }))
    }
}

Vue.use(Vuex)
export default new Store({
    state:     new LiveState(),
    mutations: livemutations,
    actions:   liveactions
    // getters:   api2Getters
})
