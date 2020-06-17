import _ from 'lodash'
import axios from 'axios'
import { Api2State, API2ROOT } from './state'
import { ActionContext, ActionTree, Store, GetterTree } from 'vuex'
import VueRouter, { Route } from 'vue-router'
import { api2Mutations } from './api2mutations'
import { api2Actions } from './api2actions'
import { UUID } from '@common/lib'


export const adminActions = {

    async serieslogin(context: ActionContext<Api2State, any>, p: any) {
        try {
            await axios.post(API2ROOT + '/serieslogin', p, { withCredentials: true })
            context.commit('seriesAuthenticated', { series: p.series, ok: true })
            console.log('authenticated getdata')
            context.dispatch('getdata')
        } catch (error) {
            context.dispatch('axiosError', error)
        }
    },

    async serieslogout(context: ActionContext<Api2State, any>, p: any) {
        try {
            await axios.post(API2ROOT + '/serieslogout', p, { withCredentials: true })
            context.commit('seriesAuthenticated', { series: p.series, ok: true })
        } catch (error) {
            context.dispatch('axiosError', error)
        }
    },

    async ensureCarDriverInfo(context: ActionContext<Api2State, any>, carids: Set<UUID>) {
        try {
            const cids = {}
            const dids = {}
            for (const carid of carids) {
                if (carid in this.state.cars) {
                    const driverid = this.state.cars[carid].driverid
                    if (!(driverid in this.state.drivers)) {
                        dids[driverid] = 1
                    }
                } else {
                    cids[carid] = 1
                }
            }

            const p = {
                series: this.state.currentSeries,
                authtype: this.state.authtype,
                type: 'update', // we are not getting entire list
                items: {
                    carids: Object.keys(cids),
                    driverids: Object.keys(dids)
                }
            }

            context.commit('gettingData', true)
            const data = (await axios.post(API2ROOT, p, { withCredentials: true })).data
            context.commit('apiData', data)
        } catch (error) {
            context.dispatch('axiosError', error)
        } finally {
            context.commit('gettingData', false)
        }
    }

}  as ActionTree<Api2State, any>


const getters = {
    // make defaultdict(true) like thing out of the store
    haveSeriesAuth: (state) => { return state.currentSeries in state.seriesAuthenticated ? state.seriesAuthenticated[state.currentSeries] : true },
    orderedEvents: (state) => { return _.orderBy(state.events, ['date']) }

} as GetterTree<Api2State, Api2State>


export function createAdminStore(router: VueRouter) {
    const store = new Store({
        state: new Api2State(),
        mutations: api2Mutations,
        actions:   { ...api2Actions,   ...adminActions },
        getters: getters
    })

    /* Create our websocket handler and default get request */
    store.state.ws.onmessage = (e) => store.commit('apiData', JSON.parse(e.data))
    store.state.ws.reconnect()
    store.state.authtype = 'series'

    /*
        On route changes, check to see if we have data or need to load it
    */
    router.beforeResolve(function(to: Route, from: Route, next: Function): void {
        if ((to.params.series) && (to.params.series !== store.state.currentSeries)) {
            store.commit('changeSeries', to.params.series)
        }
        // on any route change, if we don't have series list, try and load now
        if (store.state.serieslist.length === 0) {
            store.dispatch('getdata', { items: 'serieslist' })
        }
        next()
    })

    /* When the current series changes (URL or UI), we need to load new data */
    store.watch(
        (state: Api2State) => { return state.currentSeries },
        () => { store.dispatch('getdata') }
    )

    return store
}
