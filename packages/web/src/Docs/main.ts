import Vue from 'vue'
import VueRouter from 'vue-router'
import Vuetify from 'vuetify/lib'
import 'typeface-roboto'
import Docs from './Docs.vue'
import mdpage from './mdpage.vue'

Vue.use(Vuetify)
const base = { primary: '#c4ac11' }
const vuetify = new Vuetify({ theme: { themes: { light: base, dark: base }}})

declare const VUE_BASE: string
Vue.use(VueRouter)
const router = new VueRouter({
    mode: 'history',
    base: (VUE_BASE && VUE_BASE !== 'PUT_BASE_HERE') ? VUE_BASE : '/docs',
    routes: [
        { path: '/',          name: 'root', component: mdpage, props: { pagename: 'blank' }},
        { path: '/:pagename', name: 'md', component: mdpage, props: true }
    ]
})

new Vue({
    router,
    vuetify,
    render: h => h(Docs)
}).$mount('#app')
