import Vue from 'vue'
import VueRouter from 'vue-router'

const Announcer  = () => import('./views/announcer.vue')
const DataEntry  = () => import('./views/dataentry.vue')
const Post       = () => import('./views/post.vue')
const EventIndex = () => import('./views/eventindex.vue')
const Series     = () => import('./views/series.vue')

const routes = [
    { path: '/',                               name: 'root' },
    { path: '/:series',                        name: 'series',     component: Series },
    { path: '/:series/champ',                  name: 'champ' }, //     component: Champ },
    { path: '/:series/:eventid',         name: 'eventindex', component: EventIndex },
    { path: '/:series/:eventid/byclass', name: 'byclass' },
    { path: '/:series/:eventid/bygroup', name: 'bygroup' },
    { path: '/:series/:eventid/post',    name: 'post',       component: Post },
    { path: '/:series/:eventid/dist',    name: 'dist' },
    { path: '/:series/:eventid/tt',      name: 'toptimes' },
    { path: '/:series/:eventid/audit',   name: 'audit' },
    { path: '/:series/:eventid/bracket', name: 'bracket' },
    { path: '/:series/:eventid/grid',    name: 'grid' },
    { path: '/:series/:eventid/dialins', name: 'dialins' },

    // live paths
    { path: '/:series/:eventid/announcer', name: 'announcer', component: Announcer },
    { path: '/:series/:eventid/dataentry', name: 'dataentry', component: DataEntry }
]

declare const VUE_BASE: string
Vue.use(VueRouter)
export default new VueRouter({
    mode: 'history',
    base: (VUE_BASE && VUE_BASE !== 'PUT_BASE_HERE') ? VUE_BASE : '/results',
    routes
})
