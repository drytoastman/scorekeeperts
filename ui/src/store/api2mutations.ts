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
    state.usednumbers = []
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

        for (const key of ['listids', 'unsubscribe', 'summary', 'counts', 'attendance', 'driverbrief',
            'usednumbers', 'emailresult', 'settings', 'squareapplicationid', 'squareoauthresp']) {
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
            ['indexes', 'indexcode']
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

        // data.type in ('get', 'insert', 'update', 'delete', 'eventupdate')
        for (const key of ['registered', 'payments']) {
            if (key in data) {
                if (data.type === 'eventupdate') {
                    Vue.set(state[key], data.eventid, data[key])
                } else {
                    // get, insert, delete
                    if (data.type === 'get') { state[key] = {} }
                    if (key === 'payments') {
                        data[key].forEach((p: Payment) => {
                            if (!(p.eventid in state[key])) { Vue.set(state[key], p.eventid, []) }
                            const i = findIndex(state[key][p.eventid], { payid: p.payid })
                            if (i > 0) state[key][p.eventid].splice(i, 1)
                            if (data.type !== 'delete') {
                                state[key][p.eventid].push(p)
                            }
                        })
                    }
                    if (key === 'registered') {
                        data[key].forEach((r: Registration) => {
                            if (!(r.eventid in state[key])) { Vue.set(state[key], r.eventid, []) }
                            const i = findIndex(state[key][r.eventid], { eventid: r.eventid, carid: r.carid, session: r.session })
                            if (i > 0) state[key][r.eventid].splice(i, 1)
                            if (data.type !== 'delete') {
                                state[key][r.eventid].push(r)
                            }
                        })
                    }
                }
            }
        }
    }

} as MutationTree<Api2State>
