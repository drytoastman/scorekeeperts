import Vue from 'vue'
import Vuex, { MutationTree, ActionTree, ActionContext } from 'vuex'
import axios from 'axios'
import ReconnectingWebSocket from 'reconnecting-websocket'

import { Driver, SeriesEvent, Car, Registration, Payment, SeriesIndex, SeriesClass } from '@common/lib'

Vue.use(Vuex)

const root = '/api2/register'

function errorhandler(context: ActionContext<State, any>, error: any) {
    if (error.response) {
        if (error.response.status === 401) {
            context.commit('authenticate', false)
        }
        if (typeof error.response.data === 'object') {
            context.commit('setErrors', error.response.data.result || error.response.data.error)
        } else {
            context.commit('setErrors', [error.response.data])
        }
    } else {
        context.commit('setErrors', [error.toString().replace('Error: ', '')])
    }
}

function clearSeriesData(state: any) {
    state.classes = []
    state.indexes = []
    state.events = {}
    state.cars = {}
    state.registered = {}
    state.payments = {}
    state.counts = {}
}

class State {
    authenticated: string|boolean = ''
    errors: string[] = []
    series = ''
    driver: Driver = {} as Driver
    classes: {[key: string]: SeriesClass} = {}
    indexes: {[key: string]: SeriesIndex} = {}
    events: {[key: string]: SeriesEvent} = {}
    cars: {[key: string]: Car} = {}
    registered: {[key: string]: Registration[]} = {}
    payments: {[key: string]: { [key: string]: Payment[]}} = {}
    counts: {[key: string]: any} = {}
    emailresult: any = {}
    usednumbers: number[] = []
    ws: ReconnectingWebSocket = new ReconnectingWebSocket(`ws://${window.location.host}${root}/live`, undefined, {
        minReconnectionDelay: 1000,
        maxRetries: 10,
        startClosed: true
    })
}

const mutations = {

    authenticate(state: State, ok: boolean) {
        state.authenticated = ok
        if (!ok) {
            state.driver = {} as Driver
            clearSeriesData(this)
        } else {
            state.errors = []
            state.ws.reconnect()
        }
    },

    setErrors(state: State, errors: string[]) {
        state.errors = errors
    },

    setEmailResult(state: State, data: any[]) {
        state.emailresult = data
    },

    setUsedNumbers(state: State, data: number[]) {
        state.usednumbers = data
    },

    apiData(state: State, data: any) {
        if (data === undefined) return

        if ('driver' in data) {
            state.driver = data.driver
        }

        if (('series' in data) && (data.series !== state.series)) {
            clearSeriesData(state)
            state.series = data.series
        }

        if ('classes' in data) {
            state.classes = data.classes
        }

        if ('indexes' in data) {
            state.indexes = data.indexes
        }

        if ('events' in data) {
            if (data.type === 'get') {
                state.events = {}
            }
            data.events.forEach((e: SeriesEvent) => Vue.set(state.events, e.eventid, e))
        }

        if ('cars' in data) {
            // data.type in ('get', 'insert', 'update', 'delete')
            if (data.type === 'delete') {
                data.cars.forEach((c: Car) => Vue.delete(state.cars, c.carid))
            } else { // get, insert, update
                if (data.type === 'get') { state.cars = {} }
                data.cars.forEach((c: Car) => Vue.set(state.cars, c.carid, c))
            }
        }

        if ('registered' in data) {
            if (['delete', 'update'].includes(data.type)) {
                data.registered.forEach((r: Registration) => {
                    const a = state.registered[r.eventid]
                    const m = a.filter(i => i.carid === r.carid)
                    if (m.length > 0) {
                        const i = a.indexOf(m[0])
                        if (data.type === 'update') {
                            a.splice(i, 1, r || undefined)
                        } else {
                            a.splice(i, 1)
                        }
                    }
                })
            } else {
                // get, insert
                if (data.type === 'get') { state.registered = {} }
                data.registered.forEach((r: Registration) => {
                    if (!(r.eventid in state.registered)) { Vue.set(state.registered, r.eventid, []) }
                    state.registered[r.eventid].push(r)
                })
            }
        }

        if ('payments' in data) {
            state.payments = {}
            data.payments.forEach((p: Payment) => {
                if (!(p.eventid in state.payments))          { Vue.set(state.payments, p.eventid, {}) }
                if (!(p.carid in state.payments[p.eventid])) { Vue.set(state.payments[p.eventid], p.carid, []) }
                state.payments[p.eventid][p.carid].push(p)
            })
        }

        if ('counts' in data) {
            state.counts = {}
            data.counts.forEach((e: SeriesEvent) => Vue.set(state.counts, e.eventid, e))
        }
    }

} as MutationTree<State>


const actions = {

    async getdata(context: ActionContext<State, any>, p: any) {
        try {
            const data = (await axios.get(root + '/api', { params: p, withCredentials: true })).data
            context.commit('authenticate', true) // we must be auth if this happens
            context.commit('apiData', data)
        } catch (error) {
            errorhandler(context, error)
        }
    },

    async setdata(context: ActionContext<State, any>, p: any) {
        try {
            const data = (await axios.post(root + '/api', p, { withCredentials: true })).data
            context.commit('authenticate', true) // we must be auth if this happens
            context.commit('apiData', data)
        } catch (error) {
            errorhandler(context, error)
        }
    },

    async getUsedNumbers(context: ActionContext<State, any>, p: any) {
        try {
            const data = (await axios.get(root + '/used', { params: p, withCredentials: true })).data
            context.commit('setUsedNumbers', data)
        } catch (error) {
            errorhandler(context, error)
        }
    },

    async login(context: ActionContext<State, any>, p: any) {
        try {
            await axios.post(root + '/login', p, { withCredentials: true })
            context.commit('authenticate', true)
        } catch (error) {
            errorhandler(context, error)
        }
    },

    async logout(context: ActionContext<State, any>) {
        try {
            await axios.get(root + '/logout', { withCredentials: true })
            context.commit('authenticate', false)
        } catch (error) {
            errorhandler(context, error)
        }
    },

    async regreset(context: ActionContext<State, any>, p: any) {
        try {
            const resp = (await axios.post(root + '/regreset', p, { withCredentials: true })).data
            context.commit('setEmailResult', resp.data)
        } catch (error) {
            errorhandler(context, error)
        }
    }

}  as ActionTree<State, any>


const registerStore = new Vuex.Store({
    state: new State(),
    mutations: mutations,
    actions: actions
})
registerStore.state.ws.onmessage = (e) => registerStore.commit('apiData', JSON.parse(e.data))

export default registerStore
