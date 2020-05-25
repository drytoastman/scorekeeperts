import Vue from 'vue'
import Vuex, { MutationTree, ActionTree, ActionContext, GetterTree, Store } from 'vuex'
import { Route, NavigationGuard } from 'vue-router'
import axios from 'axios'
import _ from 'lodash'
import ReconnectingWebSocket from 'reconnecting-websocket'

import { Driver, SeriesEvent, Car, Registration, Payment, PaymentAccount, PaymentItem, SeriesIndex, SeriesClass, UUID } from '@common/lib'

Vue.use(Vuex)

const root = '/api2/register'
const EMPTY = ''

function errorhandler(context: ActionContext<RegisterState, any>, error: any) {
    if (error.response) {
        if (error.response.status === 401) {
            context.commit('authenticate', false)
        }
        if (typeof error.response.data === 'object') {
            context.commit('setErrors', [error.response.data.result || error.response.data.error])
        } else {
            if (error.response.headers['content-type'].includes('text/html')) {
                const el = document.createElement('html')
                el.innerHTML = error.response.data
                const lines = el.getElementsByTagName('body')[0].innerText.split('\n').filter(i => i !== '')
                context.commit('setErrors', lines)
            } else {
                context.commit('setErrors', [error.response.data])
            }
        }
    } else {
        let errorstring = error.toString()
        if (errorstring.startsWith('Error: ')) {
            errorstring = errorstring.slice(7)
        }
        context.commit('setErrors', [errorstring])
    }
}

export class RegisterState {
    authenticated = true  // assume we are and then fallback if our API requests fail
    errors: string[] = []
    emailresult: any = {}
    driver: Driver = {} as Driver
    serieslist: string[] = []
    listids: string[] = []
    unsubscribe: string[] = []

    // series specific
    currentSeries = EMPTY
    panelstate = [] // we set/get at will, saves state across page movement
    paymentaccounts: {[key: string]: PaymentAccount} = {}
    paymentitems: PaymentItem[] = []
    classes: {[key: string]: SeriesClass} = {}
    indexes: {[key: string]: SeriesIndex} = {}
    events: {[key: string]: SeriesEvent} = {}
    cars: {[key: string]: Car} = {}
    registered: {[key: string]: Registration[]} = {}
    payments: {[key: string]: { [key: string]: Payment[]}} = {}
    counts: {[key: string]: any} = {}

    // other more temporary things
    usednumbers: number[] = []
    busyDriver: {[key: string]: boolean} = {} // driverid set
    busyCars: {[key: string]: boolean} = {} // carid set
    busyReg:  {[key: string]: boolean} = {} // eventid set
    busyPay:  {[key: string]: boolean} = {} // eventid set

    ws: ReconnectingWebSocket = new ReconnectingWebSocket(`ws://${window.location.host}${root}/live`, undefined, {
        minReconnectionDelay: 1000,
        maxRetries: 10,
        startClosed: true
    })
}

function clearSeriesData(state: RegisterState) {
    state.panelstate = []
    state.paymentaccounts = {}
    state.paymentitems = []
    state.classes = {}
    state.indexes = {}
    state.events = {}
    state.cars = {}
    state.registered = {}
    state.payments = {}
    state.counts = {}

    state.usednumbers = []
    state.busyCars = {}
    state.busyReg = {}
    state.busyPay = {}
}

const mutations = {

    clearSeriesData(state: RegisterState) {
        clearSeriesData(state)
    },

    changeSeries(state: RegisterState, newseries: string) {
        state.currentSeries = newseries
        clearSeriesData(state)
    },

    authenticate(state: RegisterState, ok: boolean) {
        state.authenticated = ok
        if (!ok) {
            state.driver = {} as Driver
            clearSeriesData(state)
        } else {
            state.errors = []
            if (state.ws) {
                state.ws.reconnect()
            } else {
                console.error('No websocket after authenticating')
            }
        }
    },

    setErrors(state: RegisterState, errors: string[]) {
        state.errors = errors
    },

    clearErrors(state: RegisterState) {
        state.errors = []
    },

    setEmailResult(state: RegisterState, data: any[]) {
        state.emailresult = data
    },

    setUsedNumbers(state: RegisterState, data: number[]) {
        state.usednumbers = data
    },

    markBusy(state: RegisterState, busy: any) {
        const ids = (busy.id) ? [busy.id] : busy.ids
        for (const id of ids) {
            Vue.set(state[busy.key], id, true)
        }
    },

    clearBusy(state: RegisterState, busy: any) {
        const ids = (busy.id) ? [busy.id] : busy.ids
        for (const id of ids) {
            Vue.set(state[busy.key], id, false)
        }
    },

    apiData(state: RegisterState, data: any) {
        if (data === undefined) return

        if ('driver' in data) {
            state.driver = data.driver
        }

        if ('serieslist' in data) {
            state.serieslist = data.serieslist
        }

        if ('listids' in data) {
            state.listids = data.listids
        }

        if ('unsubscribe' in data) {
            state.unsubscribe = data.unsubscribe
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
            if (data.type === 'eventupdate') {
                Vue.set(state.registered, data.eventid, data.registered)
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
            if (data.type === 'get') {
                state.payments = {}
            } else if (data.type === 'eventupdate') {
                Vue.set(state.payments, data.eventid, {})
            }
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

        if ('paymentaccounts' in data) {
            if (data.type === 'get') {
                state.paymentaccounts = {}
            }
            data.paymentaccounts.forEach((a: PaymentAccount) => {
                state.paymentaccounts[a.accountid] = a
            })
        }

        if ('paymentitems' in data) {
            state.paymentitems = data.paymentitems
        }
    }

} as MutationTree<RegisterState>


const actions = {

    async getdata(context: ActionContext<RegisterState, any>, p: any) {
        try {
            if (!p) {
                p = {}
            }
            console.log(`getdata with series = ${this.state.currentSeries}`)
            p.series = this.state.currentSeries
            const data = (await axios.get(root + '/api', { params: p, withCredentials: true })).data
            context.commit('authenticate', true) // we must be auth if this happens
            context.commit('apiData', data)
        } catch (error) {
            errorhandler(context, error)
        }
    },

    async setdata(context: ActionContext<RegisterState, any>, p: any) {
        let busy = null
        try {
            if ((busy = p.busy) != null) {
                context.commit('markBusy', busy)
                delete p.busy
            }

            p.series = this.state.currentSeries
            const data = (await axios.post(root + '/api', p, { withCredentials: true })).data
            context.commit('apiData', data)
        } catch (error) {
            errorhandler(context, error)
        } finally {
            if (busy) {
                context.commit('clearBusy', busy)
            }
        }
    },

    async getUsedNumbers(context: ActionContext<RegisterState, any>, p: any) {
        try {
            p.series = this.state.currentSeries
            const data = (await axios.get(root + '/used', { params: p, withCredentials: true })).data
            context.commit('setUsedNumbers', data)
        } catch (error) {
            errorhandler(context, error)
        }
    },

    async login(context: ActionContext<RegisterState, any>, p: any) {
        try {
            await axios.post(root + '/login', p, { withCredentials: true })
            context.commit('authenticate', true)
        } catch (error) {
            errorhandler(context, error)
        }
    },

    async changePassword(context: ActionContext<RegisterState, any>, p: any) {
        try {
            await axios.post(root + '/changepassword', p, { withCredentials: true })
            context.commit('setErrors', ['Password change successful'])
        } catch (error) {
            errorhandler(context, error)
        }
    },

    async logout(context: ActionContext<RegisterState, any>) {
        try {
            await axios.get(root + '/logout', { withCredentials: true })
            context.commit('authenticate', false)
        } catch (error) {
            errorhandler(context, error)
        }
    },

    async regreset(context: ActionContext<RegisterState, any>, p: any) {
        try {
            const resp = (await axios.post(root + '/regreset', p, { withCredentials: true })).data
            context.commit('setEmailResult', resp.data)
        } catch (error) {
            errorhandler(context, error)
        }
    }

}  as ActionTree<RegisterState, any>


const getters = {
    hasPayments: (state) => (eventid: UUID, carid: UUID) => {
        return eventid in state.payments ? state.payments[eventid][carid] : false
    },

    unpaidReg: (state, getters) => (reglist: Registration[]) => {
        if (!reglist) { return [] }
        return reglist.filter(r => !getters.hasPayments(r.eventid, r.carid))
    }

} as GetterTree<RegisterState, RegisterState>


declare module 'vuex' {
    interface Store<S> {
        storeBeforeResolve: NavigationGuard;
    }
}

const registerStore = new Store({
    state: new RegisterState(),
    mutations: mutations,
    actions: actions,
    getters: getters
})


/* Create our websocket */
registerStore.state.ws.onmessage = (e) => registerStore.commit('apiData', JSON.parse(e.data))

/*
    On certain route changes, we check if we changed our series via the URL
    Also, attempt data load if we don't have anything yet for some reason
*/
registerStore.storeBeforeResolve = function storeBeforeResolve(to: Route, from: Route, next: Function): void {
    if ((to.params.series) && (to.params.series !== registerStore.state.currentSeries)) {
        registerStore.commit('changeSeries', to.params.series)
    }
    if (!registerStore.state.driver.driverid) {
        registerStore.dispatch('getdata')
    }
    next()
}

/* When we go from unauthneticated to authenticated, we are now able to load data */
registerStore.watch(
    (state: RegisterState) => { return state.authenticated },
    (newvalue, oldvalue) => {
        if ((newvalue === true) && (!oldvalue)) {
            console.log('authenticated getdata')
            registerStore.dispatch('getdata')
        }
    }
)

/* When the current series changes (URL or UI), we need to load new data */
registerStore.watch(
    (state: RegisterState) => { return state.currentSeries },
    () => {
        console.log('serieschange getdata')
        registerStore.dispatch('getdata')
    }
)

/*
   This is a corner case if the user starts on the profile page, we need to setup a default
   series, but we can't do that until we get the serieslist from the server
*/
registerStore.watch(
    (state: RegisterState) => { return state.serieslist },
    (newvalue, oldvalue) => {
        if (_.isEqual(oldvalue, newvalue)) { return } // vuex see array reassignment as a change
        if (newvalue.length > 0 && registerStore.state.currentSeries === EMPTY) {
            registerStore.commit('changeSeries', registerStore.state.serieslist[0])
        }
    }
)

export default registerStore
