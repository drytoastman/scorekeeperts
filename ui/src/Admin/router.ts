import Vue from 'vue'
import VueRouter from 'vue-router'
import Placeholder from './placeholder.vue'

Vue.use(VueRouter)

const routes = [
    {
        path: '/',
        name: 'root',
        component: Placeholder
    }
]

const router = new VueRouter({
    mode: 'history',
    base: '/admin',
    routes
})

export default router
