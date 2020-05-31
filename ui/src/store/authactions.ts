import axios from 'axios'
import { ActionTree, ActionContext } from 'vuex'
import { API2ROOT, Api2State } from './state'

export const authActions = {

    async login(context: ActionContext<Api2State, any>, p: any) {
        try {
            await axios.post(API2ROOT + '/login', p, { withCredentials: true })
            context.commit('driverAuthenticated', true)
        } catch (error) {
            context.commit('axiosError', error)
        }
    },

    async changePassword(context: ActionContext<Api2State, any>, p: any) {
        try {
            await axios.post(API2ROOT + '/changepassword', p, { withCredentials: true })
            context.commit('setErrors', ['Password change successful'])
        } catch (error) {
            context.commit('axiosError', error)
        }
    },

    async logout(context: ActionContext<Api2State, any>) {
        try {
            await axios.get(API2ROOT + '/logout', { withCredentials: true })
            context.commit('driverAuthenticated', false)
        } catch (error) {
            context.commit('axiosError', error)
        }
    },

    async regreset(context: ActionContext<Api2State, any>, p: any) {
        try {
            const data = (await axios.post(API2ROOT + '/regreset', p, { withCredentials: true })).data
            context.commit('apiData', data)
        } catch (error) {
            context.commit('axiosError', error)
        }
    }

}  as ActionTree<Api2State, any>
