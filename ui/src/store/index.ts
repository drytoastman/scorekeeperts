import Vue from 'vue'
import VueRouter, { Route } from 'vue-router'
import Vuex, { Store } from 'vuex'

import { Driver } from '@/common/driver'
import { adminActions } from './admin'
import { api2Actions, restartWebsocket } from './api2actions'
import { api2Getters } from './api2getters'
import { api2Mutations } from './api2mutations'
import { installLoggingHandlers } from './logging'
import { cartMutations, registerActions, registerGetters } from './register'
import { Api2State, API2 } from './state'
import { AUTHTYPE_DRIVER, AUTHTYPE_NONE, AUTHTYPE_SERIES } from '@/common/auth'

Vue.use(Vuex)

export function finishStore(store: Store<Api2State>, router: VueRouter, wsendpoint: string): Store<Api2State> {
    installLoggingHandlers(store)

    /* On route changes, check to see if we have data or need to load it */
    router.beforeResolve(function(to: Route, from: Route, next): void {
        if ((to.params.series) && (to.params.series !== store.state.currentSeries)) {
            store.commit('changeSeries', to.params.series)
        }
        next()
    })

    function dataWatch() {
        if (!store.state.currentSeries) return
        if (store.state.auth.admin || store.state.auth.series[store.state.currentSeries] || store.state.auth.driver) {
            console.log('restart socket and getdata')
            restartWebsocket(store, wsendpoint)
            store.dispatch('getdata')
        }
    }

    store.watch((state) => { return state.currentSeries }, dataWatch)
    store.watch((state) => { return state.auth.admin },    dataWatch)
    store.watch((state) => { return state.auth.series },   dataWatch)
    store.watch((state) => { return state.auth.driver },   dataWatch)

    store.dispatch('getdata', { items: 'serieslist,authinfo' })
    return store
}

export function createAdminStore(router: VueRouter): Store<Api2State> {
    return finishStore(
        new Store({
            state:     new Api2State(AUTHTYPE_SERIES),
            mutations: api2Mutations(true),
            actions:   { ...api2Actions,   ...adminActions },
            getters:   api2Getters
        }),
        router,
        API2.UPDATES
    )
}

export function createRegisterStore(router: VueRouter): Store<Api2State> {
    const store = finishStore(
        new Store({
            state:     new Api2State(AUTHTYPE_DRIVER),
            mutations: { ...api2Mutations(false), ...cartMutations },
            actions:   { ...api2Actions, ...registerActions },
            getters:   { ...api2Getters, ...registerGetters }
        }),
        router,
        API2.UPDATES
    )
    store.watch(
        (state: Api2State) => { return state.drivers },
        (newvalue: any) => {
            const d: Driver[] = Object.values(newvalue)
            store.commit('setDriverId', d.length > 0 ? d[0].driverid : '')
        }
    )
    return store
}

export function createLiveStore(router: VueRouter): Store<Api2State> {
    return finishStore(
        new Store({
            state:     new Api2State(AUTHTYPE_NONE),
            mutations: api2Mutations(false),
            actions:   api2Actions,
            getters:   api2Getters
        }),
        router,
        API2.LIVE
    )
}
