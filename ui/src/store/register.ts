import get from 'lodash/get'
import axios from 'axios'
import Vue from 'vue'
import { Api2State, API2 } from './state'
import { ActionContext, ActionTree, Store, GetterTree, MutationTree } from 'vuex'
import VueRouter, { Route } from 'vue-router'
import { api2Mutations } from './api2mutations'
import { api2Actions, getDataWrap } from './api2actions'
import { UUID } from '../common/util'
import { Registration } from '../common/register'
import { Driver } from '../common/driver'

export const registerActions = {

    async token(context: ActionContext<Api2State, any>, p: any) {
        return getDataWrap(context, axios.post(API2.TOKEN, p, { withCredentials: true }))
    },

    async login(context: ActionContext<Api2State, any>, p: any) {
        if (await getDataWrap(context, axios.post(API2.LOGIN, p, { withCredentials: true }))) {
            context.commit('driverAuthenticated', true)
            console.log('authenticated getdata')
            context.dispatch('getdata')
            return true
        }
    },

    async changePassword(context: ActionContext<Api2State, any>, p: any) {
        if (await getDataWrap(context, axios.post(API2.CHANGEPASSWORD, p, { withCredentials: true }))) {
            context.commit('setErrors', ['Password change successful'])
            return true
        }
    },

    async logout(context: ActionContext<Api2State, any>) {
        await getDataWrap(context, axios.get(API2.LOGOUT, { withCredentials: true }))
        context.commit('driverAuthenticated', false)
        context.commit('clearDriverData')
        return true
    }

}  as ActionTree<Api2State, any>


function deepset(nested: any, path: string[], value: any) {
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

export const cartMutations = {

    cartSetCar(state: Api2State, data: any) {
        return deepset(state.carts, [data.series, data.accountid, data.eventid, 'cars', data.carid], data.value)
    },

    cartSetOther(state: Api2State, data: any) {
        return deepset(state.carts, [data.series, data.accountid, data.eventid, 'other', data.itemid], data.value)
    }

} as MutationTree<Api2State>


const getters = {
    hasPayments: (state) => (eventid: UUID, carid: UUID) => {
        return eventid in state.payments ? state.payments[eventid].filter(p => p.carid === carid && !p.refunded).length > 0 : false
    },

    unpaidReg: (state, getters) => (reglist: Registration[]) => {
        if (!reglist) { return [] }
        return reglist.filter(r => !getters.hasPayments(r.eventid, r.carid))
    },

    driver: (state) => {
        return state.driverid ? state.drivers[state.driverid] : {}
    },

    cartGetCar: (state) => (series: string, accountid: string, eventid: UUID, carid: string) => {
        return get(state.carts, [series, accountid, eventid, 'cars', carid])
    },

    cartGetOther: (state) => (series: string, accountid: string, eventid: UUID, itemid: string) => {
        return get(state.carts, [series, accountid, eventid, 'other', itemid])
    },

    cartSum: (state) => (series: string, accountid: string) => {
        const ret = {
            total: 0,
            count: 0
        }
        const seriescart:any = get(state.carts, [series, accountid])
        if (!seriescart) return ret

        for (const eventid in seriescart) {
            for (const carid in seriescart[eventid].cars) {
                const item = state.paymentitems[seriescart[eventid].cars[carid]]
                if (item) {
                    ret.total += item.price
                    ret.count += 1
                }
            }
            for (const itemid in seriescart[eventid].other) {
                const item = state.paymentitems[itemid]
                if (item) {
                    ret.total += item.price * (seriescart[eventid].other[itemid] + 0)
                    ret.count += 1
                }
            }
        }
        return ret
    },

    allCartSums: (state, getters) => {
        const ret = {}
        for (const series in state.carts) {
            for (const accountid in state.carts[series]) {
                const sum = getters.cartSum(series, accountid)
                if (sum.total > 0) ret[accountid] = sum
            }
        }
        return ret
    }

} as GetterTree<Api2State, Api2State>



export function createRegisterStore(router: VueRouter): Store<Api2State> {
    const store = new Store({
        state: new Api2State(),
        mutations: { ...api2Mutations, ...cartMutations },
        actions:   { ...api2Actions,   ...registerActions },
        getters:   getters
    })

    /* Create our websocket handler and default get request */
    store.state.ws.onmessage = (e) => store.commit('apiData', JSON.parse(e.data))
    store.state.ws.reconnect()
    store.state.authtype = 'driver'

    /* On certain route changes, we check if we changed our series via the URL */
    router.beforeResolve(function(to: Route, from: Route, next): void {
        if ((to.params.series) && (to.params.series !== store.state.currentSeries)) {
            store.commit('changeSeries', to.params.series)
        }
        next()
    })

    /* When the current series changes (URL or UI), we need to load new data */
    store.watch(
        (state: Api2State) => { return state.currentSeries },
        () => { store.dispatch('getdata') }
    )

    /* We share the drivers table, in register case copy out the singular driverid for reference */
    store.watch(
        (state: Api2State) => { return state.drivers },
        (newvalue: any) => {
            const d: Driver[] = Object.values(newvalue)
            store.commit('setDriverId', d.length > 0 ? d[0].driverid : '')
        }
    )

    return store
}
