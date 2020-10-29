import Vue from 'vue'
import VueRouter, { RouterOptions } from 'vue-router'

const EventsView   = () => import(/* webpackChunkName: "registerviews" */  './views/events.vue')
const CarsView     = () => import(/* webpackChunkName: "registerviews" */  './views/cars.vue')
const ProfileView  = () => import(/* webpackChunkName: "registerviews" */  './views/profile.vue')
const EmailResult  = () => import(/* webpackChunkName: "registerviews" */  './views/emailresult.vue')
const TokenProcess = () => import(/* webpackChunkName: "registerviews" */  './views/tokenprocess.vue')
const HelpPage     = () => import(/* webpackChunkName: "registerviews" */  './views/help.vue')

Vue.use(VueRouter)

const routes = [
    { path: '/emailresult',    name: 'emailresult', component: EmailResult,  meta: { outside: 1 }},
    { path: '/token',          name: 'token',       component: TokenProcess, meta: { outside: 1 }},
    { path: '/profile',        name: 'profile',     component: ProfileView },
    { path: '/help',           name: 'help',        component: HelpPage },
    { path: '/:series/help',   name: 'help',        component: HelpPage },
    { path: '/:series/events', name: 'events',      component: EventsView },
    { path: '/:series/cars',   name: 'cars',        component: CarsView },

    { path: '/', redirect: { name: 'profile' }},
    { path: '/:series', redirect: { name: 'events' }}
]

declare const VUE_BASE: string
const options = {
    mode: 'history',
    base: '/register',
    routes
} as RouterOptions
if (VUE_BASE && VUE_BASE !== 'PUT_BASE_HERE') {
    options.base = VUE_BASE
}
const router = new VueRouter(options)
export default router
