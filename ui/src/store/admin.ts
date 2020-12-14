import isEmpty from 'lodash/isEmpty'
import flatten from 'lodash/flatten'
import uniq from 'lodash/uniq'
import axios from 'axios'

import { Api2State, API2 } from './state'
import { ActionContext, ActionTree } from 'vuex'
import { getDataWrap } from './api2actions'
import { UUID } from '@sctypes/util'
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
