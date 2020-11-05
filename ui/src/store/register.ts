import get from 'lodash/get'
import orderBy from 'lodash/orderBy'
import axios from 'axios'
import Vue from 'vue'

import { Api2State, API2 } from './state'
import { ActionContext, ActionTree, GetterTree, MutationTree } from 'vuex'
import { deepset } from './api2mutations'
import { getDataWrap } from './api2actions'
import { ITEM_TYPE_SERIES_FEE } from '@/common/payments.ts'
import { UUID } from '@/common/util'

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

    cartSetMembership(state: Api2State, data: any) {
        return deepset(state.carts, [state.currentSeries, data.accountid, 'noevent', 'membership'], data.value)
    },

    cartClear(state: Api2State, data: any) {
        Vue.delete(state.carts[state.currentSeries], data.accountid)
    }

} as MutationTree<Api2State>


export const registerGetters = {

    driver: (state) => {
        return state.driverid ? state.drivers[state.driverid] : {}
    },

    driverMembership: (state) => {
        return state.payments.null || []
    },

    membershipfees: (state) => {
        return orderBy(Object.values(state.paymentitems).filter(i => i.itemtype === ITEM_TYPE_SERIES_FEE), 'name')
    },

    cartGetCar: (state) => (accountid: string, eventid: UUID, carid: string, session: string) => {
        return get(state.carts, [state.currentSeries, accountid, eventid, 'cars', carid, session])
    },

    cartGetOther: (state) => (accountid: string, eventid: UUID, itemid: string) => {
        return get(state.carts, [state.currentSeries, accountid, eventid, 'other', itemid])
    },

    cartGetMembership: (state) => (accountid: string) => {
        return get(state.carts, [state.currentSeries, accountid, 'noevent', 'membership'])
    },

    cart: (state) => (accountid: string) => {
        const ret = {
            total: 0,
            purchases: [] as any[]
        }
        const accountcart:any = get(state.carts, [state.currentSeries, accountid])
        if (!accountcart) return ret

        for (const eventid in accountcart) {
            if (accountcart[eventid].membership) {
                const item = state.paymentitems[accountcart[eventid].membership]
                ret.purchases.push({
                    eventid: null,
                    itemid: item.itemid,
                    sum: item.price
                })
                ret.total += item.price
            }

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
