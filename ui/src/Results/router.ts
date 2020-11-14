import Vue from 'vue'
import VueRouter from 'vue-router'

const Announcer   = () => import(/* webpackChunkName: "resultsviews" */ './views/announcer.vue')
const DataEntry   = () => import(/* webpackChunkName: "resultsviews" */ './views/dataentry.vue')
const Post        = () => import(/* webpackChunkName: "resultsviews" */ './views/post.vue')
const ByClass     = () => import(/* webpackChunkName: "resultsviews" */ './views/byclass.vue')
const EventIndex  = () => import(/* webpackChunkName: "resultsviews" */ './views/eventindex.vue')
const Series      = () => import(/* webpackChunkName: "resultsviews" */ './views/series.vue')
const Placeholder = () => import(/* webpackChunkName: "resultsviews" */ './views/placeholder.vue')

function queryProps(route) {
    return {
        eventid: route.params.eventid,
        query: route.query
    }
}

const routes = [
    { path: '/',                         name: 'root',       component: Placeholder },
    { path: '/:series',                  name: 'series',     component: Series },
    { path: '/:series/champ',            name: 'champ',      component: Placeholder },
    { path: '/:series/:eventid',         name: 'eventindex', component: EventIndex, props: true },
    { path: '/:series/:eventid/byclass', name: 'byclass',    component: ByClass,    props: queryProps },
    { path: '/:series/:eventid/bygroup', name: 'bygroup',    component: Placeholder },
    { path: '/:series/:eventid/post',    name: 'post',       component: Post },
    { path: '/:series/:eventid/dist',    name: 'dist',       component: Placeholder },
    { path: '/:series/:eventid/tt',      name: 'toptimes',   component: Placeholder },
    { path: '/:series/:eventid/audit',   name: 'audit',      component: Placeholder },
    { path: '/:series/:eventid/grid',    name: 'grid',       component: Placeholder },
    { path: '/:series/:eventid/dialins', name: 'dialins',    component: Placeholder },
    { path: '/:series/:eventid/bracket/:challengeid', name: 'bracket', component: Placeholder },

    // live paths
    { path: '/:series/:eventid/announcer', name: 'announcer', component: Announcer },
    { path: '/:series/:eventid/dataentry', name: 'dataentry', component: DataEntry },
    { path: '/:series/:eventid/live',      name: 'live',      component: Placeholder }
]

declare const VUE_BASE: string
Vue.use(VueRouter)
export default new VueRouter({
    mode: 'history',
    base: (VUE_BASE && VUE_BASE !== 'PUT_BASE_HERE') ? VUE_BASE : '/results',
    routes
})
