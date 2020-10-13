import findIndex from 'lodash/findIndex'
import Vue from 'vue'
import { MutationTree } from 'vuex'
import { Api2State } from './state'
import { UUID } from '@/common/util'
import { Payment, Registration } from '@/common/register'

export function clearApi2SeriesData(state: Api2State): void {
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
}

export const api2Mutations = {

    driverAuthenticated(state: Api2State, ok: boolean) {
        state.driverAuthenticated = ok
        if (state.driverAuthenticated) {
            state.errors = []
        }
    },

    seriesAuthenticated(state: Api2State, data: any) {
        Vue.set(state.seriesAuthenticated, data.series, data.ok)
        if (state.seriesAuthenticated[data.series]) {
            state.errors = []
        }
    },

    adminAuthenticated(state: Api2State, ok: boolean) {
        state.adminAuthenticated = ok
        if (state.adminAuthenticated) {
            state.authtype = 'admin'
            state.errors = []
        }
    },

    adminlogout(state: Api2State) {
        state.adminAuthenticated = false
        state.seriesAuthenticated = {}
    },

    clearTokenResult(state: Api2State) {
        state.tokenresult = ''
    },

    clearDriverData(state: Api2State) {
        state.driverid = ''
        state.drivers = {}
        clearApi2SeriesData(state)
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
        if (!(busy.key in state)) {
            console.error('markBusy for unknown key: ' + busy.key)
            return
        }
        const ids = (busy.id) ? [busy.id] : busy.ids
        for (const id of ids) {
            Vue.set(state[busy.key], id, true)
        }
    },

    clearBusy(state: Api2State, busy: any) {
        if (!(busy.key in state)) {
            console.error('clearBusy for unknown key: ' + busy.key)
            return
        }
        const ids = (busy.id) ? [busy.id] : busy.ids
        for (const id of ids) {
            Vue.set(state[busy.key], id, false)
        }
    },

    gettingData(state: Api2State, value: boolean) {
        if (value) {
            state.gettingData++
        } else if (state.gettingData > 0) {
            state.gettingData--
        }
    },

    apiData(state: Api2State, data: any) {
        if (data === undefined) return

        if ('serieslist' in data) {
            state.serieslist = data.serieslist.sort()
        }

        for (const key of ['listids', 'unsubscribe', 'summary', 'attendance', 'classorder',
            'emailresult', 'settings', 'squareapplicationid', 'squareoauthresp', 'tokenresult']) {
            // easy straight assignments/replacements
            if (key in data) {
                state[key] = data[key]
            }
        }

        // For more common CRUD operations
        // data.type in ('get', 'insert', 'update', 'delete')
        for (const pair of [
            ['drivers', 'driverid'],
            ['cars', 'carid'],
            ['events', 'eventid'],
            ['paymentitems', 'itemid'],
            ['paymentaccounts', 'accountid'],
            ['classes', 'classcode'],
            ['indexes', 'indexcode'],
            ['counts', 'eventid']
        ]) {
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

        // special keying of eventid and special subkey
        if ('registered' in data) {
            // get, insert, delete
            if (data.type === 'get') { state.registered = {} }
            if (data.type === 'eventupdate') { Vue.delete(state.registered, data.eventid) }
            data.registered.forEach((r: Registration) => {
                const subkey = r.session || r.rorder
                if (!(r.eventid in state.registered)) { Vue.set(state.registered, r.eventid, {}) }
                if (data.type === 'delete') {
                    Vue.delete(state.registered[r.eventid], subkey)
                } else { // get, insert, update
                    Vue.set(state.registered[r.eventid], subkey, r)
                }
            })
        }

        // special of eventid to array of values
        if ('payments' in data) {
            if (data.type === 'get') { state.payments = {} }
            data.payments.forEach((p: Payment) => {
                if (!(p.eventid in state.payments)) { Vue.set(state.payments, p.eventid, []) }
                const i = findIndex(state.payments[p.eventid], { payid: p.payid }) // find in our original data
                if (i >= 0) state.payments[p.eventid].splice(i, 1) // if found, remove old
                if (data.type !== 'delete') {
                    state.payments[p.eventid].push(p)
                }
            })
        }
    }

} as MutationTree<Api2State>
