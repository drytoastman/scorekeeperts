import Vue from 'vue'
import VueRouter, { RouterOptions } from 'vue-router'
import Placeholder from './views/placeholder.vue'
import OAuthHandler from './views/oauthhandler.vue'
import Accounts from './views/accounts.vue'
import Classes from './views/classes.vue'
import Indexes from './views/indexes.vue'
import EventInfo from './views/eventinfo.vue'
import Payments from './views/payments.vue'
import Settings from './views/settings.vue'
import Summary from './views/summary.vue'

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

    { path: '/hostsettings',     name: 'hostsettings', component: Placeholder },
    { path: '/drivereditor',     name: 'drivereditor', component: Placeholder },

    { path: '/',                 name: 'noseries',  component: Summary, props: true },
    { path: '/:series',          name: 'summary',  component: Summary, props: true },
    { path: '/:series/settings', name: 'settings', component: Settings },
    { path: '/:series/classes',  name: 'classes',  component: Classes },
    { path: '/:series/indexes',  name: 'indexes',  component: Indexes },
    { path: '/:series/accounts', name: 'accounts', component: Accounts },
    { path: '/:series/event/:eventid',          name: 'event',     component: EventInfo, props: true },
    { path: '/:series/event/:eventid/payments', name: 'epayments', component: Payments,  props: true },
    { path: '/:series/oauth/:code',    name: 'oauth', component: OAuthHandler }
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
