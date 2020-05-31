import Vue from 'vue'
import Vuex, { GetterTree, Store } from 'vuex'
import { Route, NavigationGuard } from 'vue-router'
import _ from 'lodash'

import { Registration, UUID } from '@common/lib'

import { api2Mutations } from './api2mutations'
import { api2Actions } from './api2actions'
import { authMutations } from './authmutations'
import { authActions } from './authactions'

import { Api2State, EMPTY } from './state'

Vue.use(Vuex)

const getters = {
    hasPayments: (state) => (eventid: UUID, carid: UUID) => {
        return eventid in state.payments ? state.payments[eventid][carid] : false
    },

    unpaidReg: (state, getters) => (reglist: Registration[]) => {
        if (!reglist) { return [] }
        return reglist.filter(r => !getters.hasPayments(r.eventid, r.carid))
    }

} as GetterTree<Api2State, Api2State>


declare module 'vuex' {
    interface Store<S> {
        storeBeforeResolve: NavigationGuard;
        defaultgetlist: string;
    }
}

const api2Store = new Store({
    state: new Api2State(),
    mutations: { ...api2Mutations, ...authMutations },
    actions: { ...api2Actions, ...authActions },
    getters: getters
})


/* Create our websocket handler */
api2Store.state.ws.onmessage = (e) => api2Store.commit('apiData', JSON.parse(e.data))

api2Store.defaultgetlist = 'driverall'

/*
    On certain route changes, we check if we changed our series via the URL
    Also, attempt data load if we don't have anything yet for some reason
*/
api2Store.storeBeforeResolve = function storeBeforeResolve(to: Route, from: Route, next: Function): void {
    if ((to.params.series) && (to.params.series !== api2Store.state.currentSeries)) {
        api2Store.commit('changeSeries', to.params.series)
    }
    if (!api2Store.state.driver.driverid) {
        api2Store.dispatch('getdata')
    }
    next()
}


/* When we go from driver unauthneticated to authenticated, we are now able to load data */
api2Store.watch(
    (state: Api2State) => { return state.driverAuthenticated },
    (newvalue, oldvalue) => {
        if ((newvalue === true) && (!oldvalue)) {
            console.log('authenticated getdata')
            api2Store.dispatch('getdata')
        }
        if ((!newvalue) && (oldvalue === true)) {
            api2Store.commit('clearSeriesData')
        }
    }
)

/* When the current series changes (URL or UI), we need to load new data */
api2Store.watch(
    (state: Api2State) => { return state.currentSeries },
    () => {
        console.log('serieschange getdata')
        api2Store.dispatch('getdata')
    }
)

/*
   This is a corner case if the user starts on the profile page, we need to setup a default
   series, but we can't do that until we get the serieslist from the server
*
api2Store.watch(
    (state: Api2State) => { return state.serieslist },
    (newvalue, oldvalue) => {
        if (_.isEqual(oldvalue, newvalue)) { return } // vuex see array reassignment as a change
        if (newvalue.length > 0 && api2Store.state.currentSeries === EMPTY) {
            api2Store.commit('changeSeries', api2Store.state.serieslist[0])
        }
    }
)
*/

export default api2Store
