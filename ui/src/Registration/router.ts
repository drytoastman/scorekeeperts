import Vue from 'vue'
import VueRouter from 'vue-router'
import LoginComponent from './views/login.vue'
import EmailResult from './views/emailresult.vue'
import SeriesSummary from './views/series.vue'

Vue.use(VueRouter)

const routes = [
    {
        path: '/login',
        name: 'login',
        component: LoginComponent
    },
    {
        path: '/emailresult',
        name: 'emailresult',
        component: EmailResult
    },
    {
        path: '/series/:series',
        name: 'series',
        component: SeriesSummary
    },
    {
        path: '/',
        redirect: {
            name: 'series',
            params: {
                series: 'nwr2020'
            }
        }
    }
    /*
    {
        path: '/about',
        name: 'About',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import(/* webpackChunkName: "about" *//* '../views/About.vue')
    }
    */
]

const router = new VueRouter({
    mode: 'history',
    base: '/register',
    routes
})

export default router
