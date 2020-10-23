import axios, { AxiosResponse } from 'axios'
import { ActionTree, ActionContext } from 'vuex'
import { Api2State, API2 } from './state'


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

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function getDataWrap(context: ActionContext<Api2State, any>, axioscall: Promise<AxiosResponse<any>>, busy?: any): Promise<any> {
    try {
        if (busy) {
            context.commit('markBusy', busy)
        }
        context.commit('gettingData', true)
        const resp = await axioscall
        context.commit('apiData', resp.data)
        return resp.data
    } catch (error) {
        context.dispatch('axiosError', error)
    } finally {
        context.commit('gettingData', false)
        if (busy) {
            context.commit('clearBusy', busy)
        }
    }
    return undefined
}

export const api2Actions = {

    async getdata(context: ActionContext<Api2State, any>, p: ApiGetData) {
        if (!p) { p = { items: '' } }
        p.series = p.series || this.state.currentSeries
        p.authtype = this.state.authtype
        return await getDataWrap(context, axios.get(API2.ROOT, { params: p, withCredentials: true }))
    },

    async setdata(context: ActionContext<Api2State, any>, porig: ApiPostData) {
        const { busy, ...p } = porig
        p.series = p.series || this.state.currentSeries
        p.authtype = this.state.authtype
        return await getDataWrap(context, axios.post(API2.ROOT, p, { withCredentials: true }), busy)
    },

    async register(context: ActionContext<Api2State, any>, p: any) {
        return await getDataWrap(context, axios.post(API2.REGISTER, p, { withCredentials: true }))
    },

    async reset(context: ActionContext<Api2State, any>, p: any) {
        return await getDataWrap(context, axios.post(API2.RESET, p, { withCredentials: true }))
    },

    async axiosError(context: ActionContext<Api2State, any>, error: any) {
        if (error.response) {
            if ((error.response.status === 401) && (error.response.data.authtype)) {
                if (error.response.data.authtype === 'driver')  {
                    context.commit('driverAuthenticated', false)
                }
                if (error.response.data.authtype === 'series') {
                    if (this.state.currentSeries) {
                        context.commit('seriesAuthenticated', { series: this.state.currentSeries, ok: false })
                    }
                    context.commit('adminAuthenticated', false)  // can't be if series fails
                }
                if (error.response.data.authtype === 'admin') {
                    context.commit('adminAuthenticated', false)
                }
            }

            if (typeof error.response.data === 'object') {
                let data = error.response.data
                if (error.response.data.constructor.name === 'Blob') {
                    data = JSON.parse(await error.response.data.text())
                }
                context.commit('addErrors', [data.result || data.error])
            } else {
                const ct = error.response.headers['content-type']
                if (ct && ct.includes('text/html')) {
                    const el = document.createElement('html')
                    el.innerHTML = error.response.data
                    const lines = el.getElementsByTagName('body')[0].innerText.split('\n').filter(i => i !== '')
                    context.commit('addErrors', lines)
                } else {
                    context.commit('addErrors', [error.response.data])
                }
            }
        } else {
            let errorstring = error.toString()
            if (errorstring.startsWith('Error: ')) {
                errorstring = errorstring.slice(7)
            }
            context.commit('addErrors', [errorstring])
        }
    }

}  as ActionTree<Api2State, any>
