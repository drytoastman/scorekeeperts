import Vue from 'vue'
import VueRouter from 'vue-router'
import Placeholder from './views/placeholder.vue'
import Accounts from './views/accounts.vue'

Vue.use(VueRouter)

const routes = [
    { path: '/', name: 'root', component: Placeholder },
    { path: '/:series',          name: 'summary',  component: Placeholder },
    { path: '/:series/settings', name: 'settings', component: Placeholder },
    { path: '/:series/classes',  name: 'classes',  component: Placeholder },
    { path: '/:series/indexes',  name: 'indexes',  component: Placeholder },
    { path: '/:series/accounts', name: 'accounts', component: Accounts },
    { path: '/:series/event/:eventid', name: 'event', component: Placeholder }
]

const router = new VueRouter({
    mode: 'history',
    base: '/admin',
    routes
})

export default router
