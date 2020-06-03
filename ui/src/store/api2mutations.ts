import Vue from 'vue'
import { MutationTree } from 'vuex'
import { Car, SeriesEvent, Registration, Payment, PaymentAccount, UUID, Driver } from '@common/lib'
import { Api2State } from './state'

export function clearApi2SeriesData(state: Api2State) {
    state.paymentaccounts = {}
    state.paymentitems = {}
    state.classes = {}
    state.indexes = {}
    state.events = {}
    state.cars = {}
    state.registered = {}
    state.payments = {}
    state.counts = {}
    state.busyCars = {}
    state.busyReg = {}
    state.busyPay = {}
    state.panelstate = []
    state.usednumbers = []
}

export const api2Mutations = {

    driverAuthenticated(state: Api2State, ok: boolean) {
        state.driverAuthenticated = ok
        if (state.driverAuthenticated) {
            state.errors = []
            if (state.ws) {
                state.ws.reconnect()
            } else {
                console.error('No websocket after authenticating')
            }
        }
    },

    seriesAuthenticated(state: Api2State, data: any) {
        Vue.set(state.seriesAuthenticated, data.series, data.ok)
        if (state.seriesAuthenticated[data.series]) {
            state.errors = []
            if (state.ws) {
                state.ws.reconnect()
            } else {
                console.error('No websocket after authenticating')
            }
        }
    },

    clearSeriesData(state: Api2State) {
        clearApi2SeriesData(state)
    },

    changeSeries(state: Api2State, newseries: string) {
        state.currentSeries = newseries
        clearApi2SeriesData(state)
    },

    setDriverId(state: Api2State, driverid: UUID) {
        state.driverid = driverid
    },

    setErrors(state: Api2State, errors: string[]) {
        state.errors = errors
    },

    clearErrors(state: Api2State) {
        state.errors = []
    },

    markBusy(state: Api2State, busy: any) {
        const ids = (busy.id) ? [busy.id] : busy.ids
        for (const id of ids) {
            Vue.set(state[busy.key], id, true)
        }
    },

    clearBusy(state: Api2State, busy: any) {
        const ids = (busy.id) ? [busy.id] : busy.ids
        for (const id of ids) {
            Vue.set(state[busy.key], id, false)
        }
    },

    gettingData(state: Api2State, value: boolean) {
        state.gettingData = value
    },

    apiData(state: Api2State, data: any) {
        if (data === undefined) return

        for (const key of ['serieslist', 'listids', 'unsubscribe', 'summary', 'classes', 'indexes', 'usednumbers', 'emailresult']) {
            // easy straight assignments/replacements
            if (key in data) {
                state[key] = data[key]
            }
        }

        // For more common CRUD operations
        // data.type in ('get', 'insert', 'update', 'delete')
        for (const pair of [['paymentitems', 'itemid']]) {
            const [key, idfield] = pair
            if (key in data) {
                if (data.type === 'delete') {
                    data[key].forEach(v => Vue.delete(state[key], v[idfield]))
                } else { // get, insert, update
                    if (data.type === 'get') { state[key] = {} }
                    data[key].forEach(v => Vue.set(state[key], v[idfield], v))
                }
            }
        }

        if ('drivers' in data) {
            if (data.type === 'get') {
                state.drivers = {}
            }
            data.drivers.forEach((d: Driver) => Vue.set(state.drivers, d.driverid, d))
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
    }

} as MutationTree<Api2State>
