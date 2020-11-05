import Vue from 'vue'
import VueRouter from 'vue-router'

const Announcer = () => import(/* webpackChunkName: "liveviews" */  './views/announcer.vue')

const routes = [
    {
        path: '/announcer/:series/:eventid', name: 'announcer', component: Announcer
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
