import axios from 'axios'
import { ActionTree, ActionContext } from 'vuex'
import { Api2State, API2ROOT } from './state'


export interface ApiGetData {
    items: string;
    classcode?: string;
    // set by action handler
    series?: string;
    authtype?: string;
}

export interface ApiPostData {
    type: string;
    items: {[key: string]: []};

    eventid?: string;
    paypal?: any;
    square?: any;
    busy?: any;
    // set by action handler
    series?: string;
    authtype?: string;
}

export const api2Actions = {

    async getdata(context: ActionContext<Api2State, any>, p: ApiGetData) {
        try {
            if (!p) { p = { items: '' } }
            p.series = this.state.currentSeries
            p.authtype = this.state.authtype

            context.commit('gettingData', true)
            const data = (await axios.get(API2ROOT, { params: p, withCredentials: true })).data
            context.commit('apiData', data)
        } catch (error) {
            context.dispatch('axiosError', error)
        } finally {
            context.commit('gettingData', false)
        }
    },

    async setdata(context: ActionContext<Api2State, any>, p: ApiPostData) {
        let busy = null
        try {
            if ((busy = p.busy) != null) {
                context.commit('markBusy', busy)
                delete p.busy
            }
            p.series = this.state.currentSeries
            p.authtype = this.state.authtype
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
            if ((error.response) && (error.response.status === 401) && (error.response.data.authtype)) {
                if (error.response.data.authtype === 'driver')  {
                    context.commit('driverAuthenticated', false)
                }
                if ((error.response.data.authtype === 'series') && this.state.currentSeries) {
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
