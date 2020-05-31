import axios from 'axios'
import { ActionTree, ActionContext } from 'vuex'
import { Api2State, API2ROOT } from './state'

export const api2Actions = {

    async getdata(context: ActionContext<Api2State, any>, p: any) {
        try {
            if (!p) { p = {} }
            p.series = this.state.currentSeries
            if (!p.items) { p.items = this.defaultgetlist }
            context.commit('gettingData', true)
            const data = (await axios.get(API2ROOT, { params: p, withCredentials: true })).data
            context.commit('apiData', data)
        } catch (error) {
            context.commit('axiosError', error)
        } finally {
            context.commit('gettingData', false)
        }
    },

    async setdata(context: ActionContext<Api2State, any>, p: any) {
        let busy = null
        try {
            if ((busy = p.busy) != null) {
                context.commit('markBusy', busy)
                delete p.busy
            }
            p.series = this.state.currentSeries
            const data = (await axios.post(API2ROOT, p, { withCredentials: true })).data
            context.commit('apiData', data)
        } catch (error) {
            context.commit('axiosError', error)
        } finally {
            if (busy) {
                context.commit('clearBusy', busy)
            }
        }
    }

}  as ActionTree<Api2State, any>
