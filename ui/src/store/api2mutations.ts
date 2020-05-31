import Vue from 'vue'
import { MutationTree } from 'vuex'
import { Car, SeriesEvent, Registration, Payment, PaymentAccount, Driver } from '@common/lib'
import { Api2State } from './state'

export function clearApi2SeriesData(state: Api2State) {
    state.paymentaccounts = {}
    state.paymentitems = []
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

    axiosError(state: Api2State, error: any) {
        if (error.response) {
            if ((error.response) && (error.response.status === 401)) {
                state.driverAuthenticated = false
                state.driver = {} as Driver
            }

            if (typeof error.response.data === 'object') {
                state.errors = [error.response.data.result || error.response.data.error]
            } else {
                const ct = error.response.headers['content-type']
                if (ct && ct.includes('text/html')) {
                    const el = document.createElement('html')
                    el.innerHTML = error.response.data
                    const lines = el.getElementsByTagName('body')[0].innerText.split('\n').filter(i => i !== '')
                    state.errors = lines
                } else {
                    state.errors = [error.response.data]
                }
            }
        } else {
            let errorstring = error.toString()
            if (errorstring.startsWith('Error: ')) {
                errorstring = errorstring.slice(7)
            }
            state.errors = [errorstring]
        }
    },

    clearSeriesData(state: Api2State) {
        clearApi2SeriesData(state)
    },

    changeSeries(state: Api2State, newseries: string) {
        state.currentSeries = newseries
        clearApi2SeriesData(state)
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

        for (const key of ['driver', 'serieslist', 'listids', 'unsubscribe', 'summary', 'classes', 'indexes', 'paymentitems', 'usednumbers', 'emailresult']) {
            // easy straight assignments/replacements
            if (key in data) {
                state[key] = data[key]
            }
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
