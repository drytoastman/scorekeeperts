import orderBy from 'lodash/orderBy'
import isEmpty from 'lodash/isEmpty'
import flatten from 'lodash/flatten'
import uniq from 'lodash/uniq'
import axios from 'axios'

import { Api2State, API2 } from './state'
import { ActionContext, ActionTree, Store, GetterTree } from 'vuex'
import VueRouter, { Route } from 'vue-router'
import { api2Mutations } from './api2mutations'
import { api2Actions, getDataWrap, restartWebsocket } from './api2actions'
import { UUID } from '@/common/util'
import { sendAsDownload } from '@/util/sendtouser'


export const adminActions = {

    async adminlogin(context: ActionContext<Api2State, any>, p: any) {
        if (await getDataWrap(context, axios.post(API2.ADMINLOGIN, p, { withCredentials: true }))) {
            // undefined means an error occured, otherwise we believe we are authenticated (until next call)
            context.commit('adminAuthenticated', { ok: true })
        }
    },

    async serieslogin(context: ActionContext<Api2State, any>, p: any) {
        if (await getDataWrap(context, axios.post(API2.SERIESLOGIN, p, { withCredentials: true }))) {
            context.commit('seriesAuthenticated', { series: p.series, ok: true })
        }
    },

    async logout(context: ActionContext<Api2State, any>) {
        await getDataWrap(context, axios.get(API2.ADMINLOGOUT, { withCredentials: true }))
        context.commit('adminlogout')
    },

    async getLogs(context: ActionContext<Api2State, any>, p: any) {
        return await getDataWrap(context, axios.get(API2.LOGS, { params: p, withCredentials: true }))
    },

    async seriesadmin(context: ActionContext<Api2State, any>, p: any) {
        p.series = p.series || this.state.currentSeries
        p.authtype = this.state.auth.type
        return await getDataWrap(context, axios.post(API2.SERIESADMIN, p, { withCredentials: true }))
    },

    async carddownload(context: ActionContext<Api2State, any>, p: any) {
        try {
            p.series   = this.state.currentSeries
            p.authtype = this.state.auth.type

            context.commit('gettingData', true)
            if (p.cardtype === 'template') {
                const url = axios.getUri({ url: API2.CARDS, params: p })
                window.open(url, 'cardtemplte')
                return
            }

            const response = await axios.get(API2.CARDS, {
                params: p,
                withCredentials: true,
                responseType: 'blob'
            })

            sendAsDownload(response.data, response.headers['content-type'], response.headers['content-disposition'].split(/[="]/)[2])
            return 'done'
        } catch (error) {
            context.dispatch('axiosError', error)
        } finally {
            context.commit('gettingData', false)
        }
    },

    async ensureEditorInfo(context: ActionContext<Api2State, any>, driverids: UUID[]) {
        if (isEmpty(driverids)) return

        const p = {
            series: this.state.currentSeries,
            authtype: this.state.auth.type,
            type: 'update', // we are not necessarily getting entire list
            items: {
                editorids: driverids
            }
        }

        return await getDataWrap(context, axios.post(API2.ROOT, p, { withCredentials: true }))
    },

    async ensureTablesAndCarDriverInfo(context: ActionContext<Api2State, any>, tables: string[]) {
        const req = [] as string[]
        for (const t of tables) {
            if (isEmpty(context.state[t])) { req.push(t) }
        }
        if (req.length > 0) {
            if (!await context.dispatch('getdata', { items: req.join(',') })) {
                return
            }
        }

        let carids = [] as UUID[]
        for (const t of tables) {
            carids = [...carids, ...flatten(Object.values(context.state[t])).map((obj:any) => obj.carid)]
        }

        const cids = uniq(carids.filter(cid => !(cid in this.state.cars)))
        const dids = uniq(carids.filter(cid => cid in this.state.cars).map(cid => this.state.cars[cid].driverid))
        if (isEmpty(carids) && isEmpty(dids)) return

        const p = {
            series: this.state.currentSeries,
            authtype: this.state.auth.type,
            type: 'update', // we are not necessarily getting entire list
            items: {
                carids: cids,
                driverids: dids
            }
        }

        return await getDataWrap(context, axios.post(API2.ROOT, p, { withCredentials: true }))
    },

    async ensureSeriesCarDriverInfo(context: ActionContext<Api2State, any>) {
        const p = {
            series: this.state.currentSeries,
            authtype: this.state.auth.type,
            type: 'update', // we are not necessarily getting entire list
            items: {
                notcarids: Object.keys(this.state.cars),
                notdriverids: Object.keys(this.state.drivers)
            }
        }
        return await getDataWrap(context, axios.post(API2.ROOT, p, { withCredentials: true }))
    }

}  as ActionTree<Api2State, any>


const adminGetters = {
    orderedEvents: (state) => { return orderBy(state.events, ['date']) }
} as GetterTree<Api2State, Api2State>


export function createAdminStore(router: VueRouter): Store<Api2State> {
    const store = new Store({
        state:     new Api2State('series'),
        mutations: api2Mutations(true),
        actions:   { ...api2Actions,   ...adminActions },
        getters:   adminGetters
    })

    /*
        On route changes, check to see if we have data or need to load it
    */
    router.beforeResolve(function(to: Route, from: Route, next): void {
        if ((to.params.series) && (to.params.series !== store.state.currentSeries)) {
            store.commit('changeSeries', to.params.series)
        }
        next()
    })

    function dataWatch() {
        if (!store.state.currentSeries) return
        if (store.state.auth.admin || store.state.auth.series[store.state.currentSeries]) {
            console.log('restart socket and getdata')
            restartWebsocket(store)
            store.dispatch('getdata')
        }
    }

    store.watch((state) => { return state.currentSeries }, dataWatch)
    store.watch((state) => { return state.auth.admin }, dataWatch)
    store.watch((state) => { return state.auth.series }, dataWatch)

    store.dispatch('getdata', { items: 'serieslist,authinfo' })
    return store
}
