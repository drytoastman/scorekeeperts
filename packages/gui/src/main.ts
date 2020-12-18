import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Vuetify from 'vuetify'

Vue.config.productionTip = false

Vue.use(Vuetify)
const base = { primary: '#c4ac11' }
const vuetify = new Vuetify({ theme: { themes: { light: base, dark: base }}})

new Vue({
    router,
    store,
    vuetify,
    render: h => h(App)
}).$mount('#app')
