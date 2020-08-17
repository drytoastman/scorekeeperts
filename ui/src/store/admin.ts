import orderBy from 'lodash/orderBy'
import isEmpty from 'lodash/isEmpty'
import axios from 'axios'
import { Api2State, API2ROOT } from './state'
import { ActionContext, ActionTree, Store, GetterTree } from 'vuex'
import VueRouter, { Route } from 'vue-router'
import { api2Mutations } from './api2mutations'
import { api2Actions } from './api2actions'
import { UUID } from '@/common/util'


export const adminActions = {

    async adminlogin(context: ActionContext<Api2State, any>, p: any) {
        try {
            await axios.post(API2ROOT + '/adminlogin', p, { withCredentials: true })
            context.commit('adminAuthenticated', { ok: true })
            if (this.state.currentSeries) {
                console.log('authenticated getdata')
                context.dispatch('getdata')
            }
        } catch (error) {
            context.dispatch('axiosError', error)
        }
    },

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

    async logout(context: ActionContext<Api2State, any>) {
        try {
            await axios.get(API2ROOT + '/adminlogout', { withCredentials: true })
            context.commit('adminlogout')
        } catch (error) {
            context.dispatch('axiosError', error)
        }
    },

    async getLogs(context: ActionContext<Api2State, any>, p: any) {
        try {
            return (await axios.get(API2ROOT + '/logs', { params: p, withCredentials: true })).data
        } catch (error) {
            context.dispatch('axiosError', error)
        }
    },

    async carddownload(context: ActionContext<Api2State, any>, p: any) {
        const URL = API2ROOT + '/cards'
        try {
            p.series   = this.state.currentSeries
            p.authtype = this.state.authtype

            context.commit('gettingData', true)
            if (p.cardtype === 'template') {
                const url = axios.getUri({ url: URL, params: p })
                window.open(url, 'cardtemplte')
                return
            }

            const response = await axios.get(API2ROOT + '/cards', {
                params: p,
                withCredentials: true,
                responseType: 'blob'
            })
            const blob    = new Blob([response.data], { type: response.headers['content-type'] })
            const link    = document.createElement('a')
            link.href     = window.URL.createObjectURL(blob)
            link.download = response.headers['content-disposition'].split(/[="]/)[2]
            link.click()
        } catch (error) {
            context.dispatch('axiosError', error)
        } finally {
            context.commit('gettingData', false)
        }
    },

    async ensureDriverInfo(context: ActionContext<Api2State, any>, driverids: Set<UUID>) {
        try {
            const dids = {}
            for (const driverid of driverids) {
                if (!(driverid in this.state.drivers)) {
                    dids[driverid] = 1
                }
            }

            if (isEmpty(dids)) return

            const p = {
                series: this.state.currentSeries,
                authtype: this.state.authtype,
                type: 'update', // we are not necessarily getting entire list
                items: {
                    driverids: Object.keys(dids)
                }
            }

            // We end up using POST so we can specify a large amount of data even though we are really getting data
            context.commit('gettingData', true)
            const data = (await axios.post(API2ROOT, p, { withCredentials: true })).data
            context.commit('apiData', data)
        } catch (error) {
            context.dispatch('axiosError', error)
        } finally {
            context.commit('gettingData', false)
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

            if (isEmpty(carids) && isEmpty(dids)) return

            const p = {
                series: this.state.currentSeries,
                authtype: this.state.authtype,
                type: 'update', // we are not necessarily getting entire list
                items: {
                    carids: Object.keys(cids),
                    driverids: Object.keys(dids)
                }
            }

            // We end up using POST so we can specify a large amount of data even though we are really getting data
            context.commit('gettingData', true)
            const data = (await axios.post(API2ROOT, p, { withCredentials: true })).data
            context.commit('apiData', data)
        } catch (error) {
            context.dispatch('axiosError', error)
        } finally {
            context.commit('gettingData', false)
        }
    },

    async ensureSeriesCarDriverInfo(context: ActionContext<Api2State, any>) {
        try {
            const p = {
                series: this.state.currentSeries,
                authtype: this.state.authtype,
                type: 'update', // we are not necessarily getting entire list
                items: {
                    notcarids: Object.keys(this.state.cars),
                    notdriverids: Object.keys(this.state.drivers)
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
    orderedEvents: (state) => { return orderBy(state.events, ['date']) }
} as GetterTree<Api2State, Api2State>


export function createAdminStore(router: VueRouter): Store<Api2State> {
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
    router.beforeResolve(function(to: Route, from: Route, next): void {
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
