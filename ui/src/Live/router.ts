import Vue from 'vue'
import VueRouter from 'vue-router'

import announcer from './views/announcer.vue'

const routes = [
    {
        path: '/announcer/:series/:eventid',
        name: 'announcer',
        component: announcer
    }
    // { path: '/', redirect: { name: 'announcer' }}
]

declare const VUE_BASE: string
Vue.use(VueRouter)
export default new VueRouter({
    mode: 'history',
    base: (VUE_BASE && VUE_BASE !== 'PUT_BASE_HERE') ? VUE_BASE : '/live',
    routes
})
