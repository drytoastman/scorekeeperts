import Vue from 'vue'
import VueRouter from 'vue-router'

const EventsView   = () => import(/* webpackChunkName: "registerviews" */  './views/events.vue')
const CarsView     = () => import(/* webpackChunkName: "registerviews" */  './views/cars.vue')
const ProfileView  = () => import(/* webpackChunkName: "registerviews" */  './views/profile.vue')
const EntriesView  = () => import(/* webpackChunkName: "registerviews" */  './views/entrylist.vue')
const EmailResult  = () => import(/* webpackChunkName: "registerviews" */  './views/emailresult.vue')
const TokenProcess = () => import(/* webpackChunkName: "registerviews" */  './views/tokenprocess.vue')
const HelpPage     = () => import(/* webpackChunkName: "registerviews" */  './views/help.vue')

const routes = [
    { path: '/emailresult',    name: 'emailresult', component: EmailResult,  meta: { outside: 1 }},
    { path: '/token',          name: 'token',       component: TokenProcess, meta: { outside: 1 }},
    { path: '/profile',        name: 'profile',     component: ProfileView },
    { path: '/help',           name: 'help',        component: HelpPage },
    { path: '/:series/help',   name: 'help',        component: HelpPage },
    { path: '/:series/events', name: 'events',      component: EventsView },
    { path: '/:series/cars',   name: 'cars',        component: CarsView },
    { path: '/:series/entries/:eventslug', name: 'entries', component: EntriesView, props: true },

    { path: '/', redirect: { name: 'profile' }},
    { path: '/:series', redirect: { name: 'events' }}
]

declare const VUE_BASE: string
Vue.use(VueRouter)
export default new VueRouter({
    mode: 'history',
    base: (VUE_BASE && VUE_BASE !== 'PUT_BASE_HERE') ? VUE_BASE : '/register',
    routes
})
