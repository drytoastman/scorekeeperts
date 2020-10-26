import Vue from 'vue'
import VueRouter, { RouterOptions } from 'vue-router'

// const Placeholder  = () => import(/* webpackChunkName: "adminviews" */  './views/placeholder.vue')
const Summary      = () => import(/* webpackChunkName: "adminviews" */  './views/summary.vue')
const OAuthHandler = () => import(/* webpackChunkName: "adminviews" */  './views/oauthhandler.vue')
const Accounts     = () => import(/* webpackChunkName: "adminviews" */  './views/accounts.vue')
const Classes      = () => import(/* webpackChunkName: "adminviews" */  './views/classes.vue')
const Indexes      = () => import(/* webpackChunkName: "adminviews" */  './views/indexes.vue')
const EventInfo    = () => import(/* webpackChunkName: "adminviews" */  './views/eventinfo.vue')
const Entrants     = () => import(/* webpackChunkName: "adminviews" */  './views/entrants.vue')
const Settings     = () => import(/* webpackChunkName: "adminviews" */  './views/settings.vue')
const UsedNumbers  = () => import(/* webpackChunkName: "adminviews" */  './views/usednumbers.vue')
const Attendance   = () => import(/* webpackChunkName: "adminviews" */  './views/attendance.vue')
const SeriesLogs   = () => import(/* webpackChunkName: "adminviews" */  './views/serieslogs.vue')
const HostSettings = () => import(/* webpackChunkName: "adminviews" */  './views/hostsettings.vue')
const DriverEditor = () => import(/* webpackChunkName: "adminviews" */  './views/drivereditor.vue')
const Archive      = () => import(/* webpackChunkName: "adminviews" */  './views/archive.vue')
const Purge        = () => import(/* webpackChunkName: "adminviews" */  './views/purge.vue')
const NewSeries    = () => import(/* webpackChunkName: "adminviews" */  './views/newseries.vue')
const NewEvents    = () => import(/* webpackChunkName: "adminviews" */  './views/newevents.vue')

Vue.use(VueRouter)

const routes = [
    {
        path: '/oauth',
        name: 'oauthtrampoline',
        redirect: to => {
            const { query } = to
            return {
                name: 'oauth',
                params: { series: query.state, code: query.code },
                query: {}
            }
        }
    },

    { path: '/drivereditor',     name: 'drivereditor', component: DriverEditor },
    { path: '/hostsettings',     name: 'hostsettings', meta: { adminauth: 1 }, component: HostSettings },
    { path: '/serverlogs',       name: 'serverlogs',   meta: { adminauth: 1 }, component: SeriesLogs },

    { path: '/',                       name: 'noseries',  component: Summary, props: true },
    { path: '/:series',                name: 'summary',   component: Summary, props: true },
    { path: '/:series/settings',       name: 'settings',  component: Settings },
    { path: '/:series/classes',        name: 'classes',   component: Classes },
    { path: '/:series/indexes',        name: 'indexes',   component: Indexes },
    { path: '/:series/accounts',       name: 'accounts',  component: Accounts },
    { path: '/:series/payments',       name: 'payments',  component: Entrants },
    { path: '/:series/attendseries',   name: 'attendseries', meta: { marker: 'attendance' }, component: Attendance, props: { type: 'series' }},
    { path: '/:series/attendevent',    name: 'attendevent',  meta: { marker: 'attendance' }, component: Attendance, props: { type: 'event'  }},
    { path: '/:series/attendunique',   name: 'attendunique', meta: { marker: 'attendance' }, component: Attendance, props: { type: 'unique' }},
    { path: '/:series/usednumbers',    name: 'usednumbers',  component: UsedNumbers },
    { path: '/:series/archive',        name: 'archive',      component: Archive },
    { path: '/:series/purge',          name: 'purge',        component: Purge },
    { path: '/:series/newseries',      name: 'newseries',    component: NewSeries },
    { path: '/:series/newevents',      name: 'newevents',    component: NewEvents },
    { path: '/:series/event/:eventid', name: 'event',        component: EventInfo, props: true },
    { path: '/:series/oauth/:code',    name: 'oauth',        component: OAuthHandler }
]

declare const VUE_BASE: string
const options = {
    mode: 'history',
    base: '/admin',
    routes
} as RouterOptions
if (VUE_BASE && VUE_BASE !== 'PUT_BASE_HERE') {
    options.base = VUE_BASE
}
const router = new VueRouter(options)
export default router
