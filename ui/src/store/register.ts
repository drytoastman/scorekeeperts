import get from 'lodash/get'
import orderBy from 'lodash/orderBy'
import axios from 'axios'
import Vue from 'vue'
import { Api2State, API2 } from './state'
import { ActionContext, ActionTree, Store, GetterTree, MutationTree } from 'vuex'
import VueRouter, { Route } from 'vue-router'
import { api2Mutations, deepset } from './api2mutations'
import { api2Actions, getDataWrap } from './api2actions'

import { ITEM_TYPE_GENERAL_FEE, ITEM_TYPE_ENTRY_FEE } from '@/common/payments.ts'
import { UUID } from '@/common/util'
import { Driver } from '@/common/driver'

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


export const cartMutations = {

    cartSetCar(state: Api2State, data: any) {
        return deepset(state.carts, [state.currentSeries, data.accountid, data.eventid, 'cars', data.carid, data.session], data.value)
    },

    cartSetOther(state: Api2State, data: any) {
        return deepset(state.carts, [state.currentSeries, data.accountid, data.eventid, 'other', data.itemid], data.value)
    },

    cartClear(state: Api2State, data: any) {
        Vue.delete(state.carts[state.currentSeries], data.accountid)
    }

} as MutationTree<Api2State>


const getters = {
    driver: (state) => {
        return state.driverid ? state.drivers[state.driverid] : {}
    },

    eventitems: (state) => (eventid: UUID) => {
        if (!state.events[eventid].accountid) return []
        const itemids = state.events[eventid].items.map(m => m.itemid)
        return Object.values(state.paymentitems).filter(i => itemids.includes(i.itemid))
    },

    evententryfees: (state, getters) => (eventid: UUID) => {
        return orderBy(getters.eventitems(eventid).filter(i => i.itemtype === ITEM_TYPE_ENTRY_FEE), 'name')
    },

    eventotherfees: (state, getters) => (eventid: UUID) => {
        return getters.eventitems(eventid).filter(i => i.itemtype === ITEM_TYPE_GENERAL_FEE).map(i => ({
            item: i,
            map: state.events[eventid].items.filter(m => m.itemid === i.itemid)[0]
        }))
    },

    cartGetCar: (state) => (accountid: string, eventid: UUID, carid: string, session: string) => {
        return get(state.carts, [state.currentSeries, accountid, eventid, 'cars', carid, session])
    },

    cartGetOther: (state) => (accountid: string, eventid: UUID, itemid: string) => {
        return get(state.carts, [state.currentSeries, accountid, eventid, 'other', itemid])
    },

    cart: (state) => (accountid: string) => {
        const ret = {
            total: 0,
            purchases: [] as any[]
        }
        const accountcart:any = get(state.carts, [state.currentSeries, accountid])
        if (!accountcart) return ret

        for (const eventid in accountcart) {
            for (const carid in accountcart[eventid].cars) {
                for (const session in accountcart[eventid].cars[carid]) {
                    const item = state.paymentitems[accountcart[eventid].cars[carid][session]]
                    if (item) {
                        ret.purchases.push({
                            eventid: eventid,
                            carid: carid,
                            session: session,
                            itemid: item.itemid,
                            sum: item.price
                        })
                        ret.total += item.price
                    }
                }
            }
            for (const itemid in accountcart[eventid].other) {
                const item = state.paymentitems[itemid]
                const count = accountcart[eventid].other[itemid] + 0
                if (item) {
                    for (let ii = 0; ii < count; ii++) {
                        ret.purchases.push({
                            eventid: eventid,
                            itemid: item.itemid,
                            sum: item.price
                        })
                        ret.total += item.price
                    }
                }
            }
        }

        return ret
    },

    seriesCarts: (state, getters) => {
        const ret = {}
        for (const accountid in state.carts[state.currentSeries]) {
            const p = getters.cart(accountid)
            ret[accountid] = p
        }
        return ret
    }

} as GetterTree<Api2State, Api2State>



export function createRegisterStore(router: VueRouter): Store<Api2State> {
    const store = new Store({
        state: new Api2State(),
        mutations: { ...api2Mutations(false), ...cartMutations },
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
