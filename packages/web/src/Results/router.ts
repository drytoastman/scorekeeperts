import Vue from 'vue'
import VueRouter from 'vue-router'

const Announcer      = () => import(/* webpackChunkName: "resultsviews1" */ './views/announcer.vue')
const ProPanel       = () => import(/* webpackChunkName: "resultsviews1" */ './views/propanel.vue')
const User           = () => import(/* webpackChunkName: "resultsviews1" */ './views/user.vue')
const DataEntry      = () => import(/* webpackChunkName: "resultsviews1" */ './views/dataentry.vue')
const ResultsDisplay = () => import(/* webpackChunkName: "resultsviews" */ './views/resultsdisplay.vue')
const ChampDisplay   = () => import(/* webpackChunkName: "resultsviews" */ './views/champdisplay.vue')
const TTDisplay      = () => import(/* webpackChunkName: "resultsviews" */ './views/ttdisplay.vue')
const EventIndex     = () => import(/* webpackChunkName: "resultsviews" */ './views/eventindex.vue')
const Series         = () => import(/* webpackChunkName: "resultsviews" */ './views/series.vue')
const Placeholder    = () => import(/* webpackChunkName: "resultsviews" */ './views/placeholder.vue')
const Grid           = () => import(/* webpackChunkName: "resultsviews" */ './views/grid.vue')
const Dialins        = () => import(/* webpackChunkName: "resultsviews" */ './views/dialins.vue')
const Challenge      = () => import(/* webpackChunkName: "resultsviews" */ './views/challenge.vue')

function queryProps(route) {
    function tolist(q) {
        if (!q)      return undefined
        if (q.split) return q.split(',')
        return [q]
    }

    return {
        type:      route.name,
        eventslug: route.params.eventslug,
        codes:     tolist(route.query.codes),
        groups:    tolist(route.query.groups),
        counted:   route.query.counted
    }
}

const routes = [
    { path: '/',                             name: 'root',       component: Placeholder },
    { path: '/:series',                      name: 'series',     component: Series },
    { path: '/:series/champ',                name: 'champ',      component: ChampDisplay },
    { path: '/:series/:eventslug',           name: 'eventindex', component: EventIndex,     props: true },
    { path: '/:series/:eventslug/byclass',   name: 'byclass',    component: ResultsDisplay, props: queryProps },
    { path: '/:series/:eventslug/bygroup',   name: 'bygroup',    component: ResultsDisplay, props: queryProps },
    { path: '/:series/:eventslug/post',      name: 'post',       component: ResultsDisplay, props: queryProps },
    { path: '/:series/:eventslug/tt',        name: 'toptimes',   component: TTDisplay,      props: queryProps },
    { path: '/:series/:eventslug/audit',     name: 'audit',      component: Placeholder },
    { path: '/:series/:eventslug/grid',      name: 'grid',       component: Grid,           props: true },
    { path: '/:series/:eventslug/dialins',   name: 'dialins',    component: Dialins,        props: true },
    { path: '/:series/:eventslug/bracket/:chalslug', name: 'bracket', component: Challenge, props: true },

    // live paths
    { path: '/:series/:eventslug/announcer', name: 'announcer',  component: Announcer },
    { path: '/:series/:eventslug/propanel',  name: 'propanel',   component: ProPanel },
    { path: '/:series/:eventslug/dataentry', name: 'dataentry',  component: DataEntry },
    { path: '/:series/:eventslug/user',      name: 'user',       component: User }
]

declare const VUE_BASE: string
Vue.use(VueRouter)
export default new VueRouter({
    mode: 'history',
    base: (VUE_BASE && VUE_BASE !== 'PUT_BASE_HERE') ? VUE_BASE : '/results',
    routes
})
