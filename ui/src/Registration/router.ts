import Vue from 'vue'
import VueRouter, { RouterOptions } from 'vue-router'
import EventsView from './views/events.vue'
import CarsView from './views/cars.vue'
import ProfileView from './views/profile.vue'
import EmailResult from './views/emailresult.vue'

Vue.use(VueRouter)

const routes = [
    {
        path: '/emailresult',
        name: 'emailresult',
        component: EmailResult
    },
    {
        path: '/profile',
        name: 'profile',
        component: ProfileView
    },
    {
        path: '/:series/events',
        name: 'events',
        component: EventsView
    },
    {
        path: '/:series/cars',
        name: 'cars',
        component: CarsView
    },
    {
        path: '/',
        redirect: {
            name: 'profile'
        }
    }
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
