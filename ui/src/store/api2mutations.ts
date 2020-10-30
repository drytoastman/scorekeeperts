import findIndex from 'lodash/findIndex'
import Vue from 'vue'
import { MutationTree } from 'vuex'
import { Api2State, EMPTY } from './state'
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

/* Helper functions that do some lodash like things but force reactivity */
export function ensure(obj: {[key: string]: any}, key: string, val: unknown): void {
    if (!(key in obj)) { Vue.set(obj, key, val) }
}

// lodash like remove
export function findDelete(list: Array<unknown>, search: {[key: string]: any}): void {
    const i = findIndex(list, search) // find in our original data
    if (i >= 0) list.splice(i, 1) // if found, remove old
}

// lodash like set
export function deepset(nested: {[key: string]: any}, path: string[], value: unknown): void {
    for (let ii = 0; ii < path.length; ii++) {
        const key = path[ii]
        if (ii === path.length - 1) {
            Vue.set(nested, key, value)
            break
        }
        if (!nested[key]) {
            Vue.set(nested, key, {})
        }
        nested = nested[key]
    }
}

export function api2Mutations(adminOptions: boolean):  MutationTree<Api2State> {
    return {
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

        changeSeries(state: Api2State, newseries: string) {
            state.currentSeries = newseries
            clearApi2SeriesData(state)
            if (adminOptions) {
                state.attendance = {}
            }
        },

        seriesGone(state: Api2State, series: string) {
            state.currentSeries = EMPTY
            clearApi2SeriesData(state)
            state.attendance = {}
            state.serieslist = state.serieslist.filter(s => s !== series)
        },

        setDriverId(state: Api2State, driverid: UUID) {
            state.driverid = driverid
        },

        addErrors(state: Api2State, errors: string[]) {
            state.errors = [...state.errors, ...errors]
        },

        clearErrors(state: Api2State) {
            state.errors = []
        },

        addInfos(state: Api2State, infos: string[]) {
            state.infos = [...state.infos, ...infos]
        },

        clearInfos(state: Api2State) {
            state.infos = []
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

            if ('errors' in data) {
                state.errors = [...state.errors, ...data.errors]
            }

            for (const key of ['listids', 'unsubscribe', 'summary', 'attendance', 'classorder', 'ismainserver', 'paxlists',
                'emailresult', 'settings', 'squareapplicationid', 'squareoauthresp', 'tokenresult', 'driversattr']) {
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
                    if (data.type === 'get') { state[key] = {} }
                    if (data.type === 'delete') {
                        data[key].forEach(v => Vue.delete(state[key], v[idfield]))
                    } else { // get, insert, update
                        data[key].forEach(v => Vue.set(state[key], v[idfield], v))
                    }
                }
            }

            if ('registered' in data) {
                // get, insert, delete, eventupdate
                if (data.type === 'get') { state.registered = {} }
                if (data.type === 'eventupdate') { Vue.delete(state.registered, data.eventid) }
                data.registered.forEach((r: Registration) => {
                    if (!adminOptions) {
                        // special keying of eventid and special subkey
                        const subkey = r.session || r.rorder
                        ensure(state.registered, r.eventid, {})
                        if (data.type === 'delete') {
                            Vue.delete(state.registered[r.eventid], subkey)
                        } else { // get, insert, update
                            Vue.set(state.registered[r.eventid], subkey, r)
                        }
                    } else {
                        ensure(state.registered, r.eventid, [])
                        findDelete(state.registered[r.eventid], { carid: r.carid, session: r.session })
                        if (data.type !== 'delete') {
                            state.registered[r.eventid].push(r)
                        }
                    }
                })
            }

            // special of eventid to array of values
            if ('payments' in data) {
                // get, insert, delete, eventupdate
                if (data.type === 'get') { state.payments = {} }
                if (data.type === 'eventupdate') { Vue.delete(state.payments, data.eventid) }
                data.payments.forEach((p: Payment) => {
                    ensure(state.payments, p.eventid, [])
                    findDelete(state.payments[p.eventid], { payid: p.payid })
                    if (data.type !== 'delete') {
                        state.payments[p.eventid].push(p)
                    }
                })
            }
        }
    }
}
