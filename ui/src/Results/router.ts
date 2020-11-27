import Vue from 'vue'
import VueRouter from 'vue-router'

const Announcer      = () => import(/* webpackChunkName: "resultsviews" */ './views/announcer.vue')
const User           = () => import(/* webpackChunkName: "resultsviews" */ './views/user.vue')
const DataEntry      = () => import(/* webpackChunkName: "resultsviews" */ './views/dataentry.vue')
const ResultsDisplay = () => import(/* webpackChunkName: "resultsviews" */ './views/resultsdisplay.vue')
const ChampDisplay   = () => import(/* webpackChunkName: "resultsviews" */ './views/champdisplay.vue')
const TTDisplay      = () => import(/* webpackChunkName: "resultsviews" */ './views/ttdisplay.vue')
const EventIndex     = () => import(/* webpackChunkName: "resultsviews" */ './views/eventindex.vue')
const Series         = () => import(/* webpackChunkName: "resultsviews" */ './views/series.vue')
const Placeholder    = () => import(/* webpackChunkName: "resultsviews" */ './views/placeholder.vue')

function queryProps(route) {
    function tolist(q) {
        if (!q)      return undefined
        if (q.split) return q.split(',')
        return [q]
    }

    return {
        type:    route.name,
        eventid: route.params.eventid,
        codes:   tolist(route.query.codes),
        groups:  tolist(route.query.groups),
        counted: route.query.counted
    }
}

const routes = [
    { path: '/',                         name: 'root',       component: Placeholder },
    { path: '/:series',                  name: 'series',     component: Series },
    { path: '/:series/champ',            name: 'champ',      component: ChampDisplay },
    { path: '/:series/:eventid',         name: 'eventindex', component: EventIndex,     props: true },
    { path: '/:series/:eventid/byclass', name: 'byclass',    component: ResultsDisplay, props: queryProps },
    { path: '/:series/:eventid/bygroup', name: 'bygroup',    component: ResultsDisplay, props: queryProps },
    { path: '/:series/:eventid/post',    name: 'post',       component: ResultsDisplay, props: queryProps },
    { path: '/:series/:eventid/tt',      name: 'toptimes',   component: TTDisplay,      props: queryProps },
    { path: '/:series/:eventid/audit',   name: 'audit',      component: Placeholder },
    { path: '/:series/:eventid/grid',    name: 'grid',       component: Placeholder },
    { path: '/:series/:eventid/dialins', name: 'dialins',    component: Placeholder },
    { path: '/:series/:eventid/bracket/:challengeid', name: 'bracket', component: Placeholder },

    // live paths
    { path: '/:series/:eventid/announcer', name: 'announcer', component: Announcer },
    { path: '/:series/:eventid/dataentry', name: 'dataentry', component: DataEntry },
    { path: '/:series/:eventid/user',      name: 'user',      component: User }
]

declare const VUE_BASE: string
Vue.use(VueRouter)
export default new VueRouter({
    mode: 'history',
    base: (VUE_BASE && VUE_BASE !== 'PUT_BASE_HERE') ? VUE_BASE : '/results',
    routes
})
