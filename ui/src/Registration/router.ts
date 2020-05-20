import Vue from 'vue'
import VueRouter from 'vue-router'
import EventsView from './views/events.vue'
import CarsView from './views/cars.vue'
import ProfileView from './views/profile.vue'
// import LoginComponent from './views/login.vue'
import EmailResult from './views/emailresult.vue'

Vue.use(VueRouter)

const routes = [
    /*
    {
        path: '/login',
        name: 'login',
        component: LoginComponent
    }, */
    {
        path: '/emailresult',
        name: 'emailresult',
        component: EmailResult
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
        path: '/:series/profile',
        name: 'profile',
        component: ProfileView
    }
    /*
    {
        path: '/',
        redirect: {
            name: 'profile'
        }
    } */
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
