import Vue from 'vue'
import Vuex, { ActionContext } from 'vuex'
import { MergeServer } from 'scdb/mergeserverrepo'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        mergeservers: [] as MergeServer[]
    },
    mutations: {
        setServers(state: any, data: any) {
            state.mergeservers = data
        }
    },
    actions: {
        async init(context: ActionContext<any, any>) {
            window.db.merge.getInActive().then(data => {
                context.commit('setServers', data)
            })
            console.log(await window.sp.list())
            const d = window.dg.createSocket({ type: 'udp4', reuseAddr: true })
            d.on('message', (msg) => {
                console.log(msg.toString())
            })
            d.on('listening', () => console.log('listening'))
            d.on('error', (err) => console.log(err))
            d.bind(5353, () => {
                d.addMembership('224.0.0.251')
            })
        }
    },
    modules: {
    }
})
