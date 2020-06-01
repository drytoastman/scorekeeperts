import axios from 'axios'
import { ActionTree, ActionContext } from 'vuex'
import { Api2State, API2ROOT } from './state'

export const api2Actions = {

    async getdata(context: ActionContext<Api2State, any>, p: any) {
        try {
            if (!p) { p = {} }
            p.series = this.state.currentSeries
            if (!p.items) { p.items = this.state.defaultgetlist }
            context.commit('gettingData', true)
            const data = (await axios.get(API2ROOT, { params: p, withCredentials: true })).data
            context.commit('apiData', data)
        } catch (error) {
            context.dispatch('axiosError', error)
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
            context.dispatch('axiosError', error)
        } finally {
            if (busy) {
                context.commit('clearBusy', busy)
            }
        }
    },

    async axiosError(context: ActionContext<Api2State, any>, error: any) {
        if (error.response) {
            if ((error.response) && (error.response.status === 401) && (error.response.data.types)) {
                if (error.response.data.types.includes('driver'))  {
                    context.commit('driverAuthenticated', false)
                }
                if (error.response.data.types.includes('series') && this.state.currentSeries) {
                    context.commit('seriesAuthenticated', { series: this.state.currentSeries, ok: false })
                }
            }

            if (typeof error.response.data === 'object') {
                context.commit('setErrors', [error.response.data.result || error.response.data.error])
            } else {
                const ct = error.response.headers['content-type']
                if (ct && ct.includes('text/html')) {
                    const el = document.createElement('html')
                    el.innerHTML = error.response.data
                    const lines = el.getElementsByTagName('body')[0].innerText.split('\n').filter(i => i !== '')
                    context.commit('setErrors', lines)
                } else {
                    context.commit('setErrors', [error.response.data])
                }
            }
        } else {
            let errorstring = error.toString()
            if (errorstring.startsWith('Error: ')) {
                errorstring = errorstring.slice(7)
            }
            context.commit('setErrors', [errorstring])
        }
    }

}  as ActionTree<Api2State, any>
