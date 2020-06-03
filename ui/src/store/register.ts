import axios from 'axios'
import { Api2State, API2ROOT } from './state'
import { ActionContext, ActionTree, Store, GetterTree } from 'vuex'
import VueRouter, { Route } from 'vue-router'
import { api2Mutations } from './api2mutations'
import { api2Actions } from './api2actions'
import { UUID, Registration, Driver } from '@common/lib'

export const registerActions = {

    async login(context: ActionContext<Api2State, any>, p: any) {
        try {
            await axios.post(API2ROOT + '/login', p, { withCredentials: true })
            context.commit('driverAuthenticated', true)
            console.log('authenticated getdata')
            context.dispatch('getdata')
        } catch (error) {
            context.dispatch('axiosError', error)
        }
    },

    async changePassword(context: ActionContext<Api2State, any>, p: any) {
        try {
            await axios.post(API2ROOT + '/changepassword', p, { withCredentials: true })
            context.commit('setErrors', ['Password change successful'])
        } catch (error) {
            context.dispatch('axiosError', error)
        }
    },

    async logout(context: ActionContext<Api2State, any>) {
        try {
            await axios.get(API2ROOT + '/logout', { withCredentials: true })
            context.commit('driverAuthenticated', false)
        } catch (error) {
            context.dispatch('axiosError', error)
        }
    },

    async regreset(context: ActionContext<Api2State, any>, p: any) {
        try {
            const data = (await axios.post(API2ROOT + '/regreset', p, { withCredentials: true })).data
            context.commit('apiData', data)
        } catch (error) {
            context.dispatch('axiosError', error)
        }
    }

}  as ActionTree<Api2State, any>



const getters = {
    hasPayments: (state) => (eventid: UUID, carid: UUID) => {
        return eventid in state.payments ? state.payments[eventid][carid] : false
    },

    unpaidReg: (state, getters) => (reglist: Registration[]) => {
        if (!reglist) { return [] }
        return reglist.filter(r => !getters.hasPayments(r.eventid, r.carid))
    },

    driver: (state) => {
        return state.driverid ? state.drivers[state.driverid] : {}
    }

} as GetterTree<Api2State, Api2State>



export function createRegisterStore(router: VueRouter) {
    const store = new Store({
        state: new Api2State(),
        mutations: api2Mutations,
        actions:   { ...api2Actions,   ...registerActions },
        getters:   getters
    })

    /* Create our websocket handler and default get request */
    store.state.ws.onmessage = (e) => store.commit('apiData', JSON.parse(e.data))
    store.state.authtype = 'driver'

    /* On certain route changes, we check if we changed our series via the URL */
    router.beforeResolve(function(to: Route, from: Route, next: Function): void {
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
