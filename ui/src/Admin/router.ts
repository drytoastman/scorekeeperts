import Vue from 'vue'
import VueRouter from 'vue-router'
import Placeholder from './views/placeholder.vue'
import OAuthHandler from './views/oauthhandler.vue'
import Accounts from './views/accounts.vue'

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

    { path: '/:series',          name: 'summary',  component: Placeholder },
    { path: '/:series/settings', name: 'settings', component: Placeholder },
    { path: '/:series/classes',  name: 'classes',  component: Placeholder },
    { path: '/:series/indexes',  name: 'indexes',  component: Placeholder },
    { path: '/:series/accounts', name: 'accounts', component: Accounts },
    { path: '/:series/event/:eventid', name: 'event', component: Placeholder },
    { path: '/:series/oauth/:code',    name: 'oauth', component: OAuthHandler },

    {
        path: '/',
        redirect: {
            name: 'summary'
        }
    }
]

const router = new VueRouter({
    mode: 'history',
    base: '/admin',
    routes
})

export default router
