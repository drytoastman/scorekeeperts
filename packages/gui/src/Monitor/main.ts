import Vue from 'vue'
import Sync from './Sync.vue'
import store from './store'
import Vuetify from 'vuetify'

Vue.config.productionTip = false

Vue.use(Vuetify)
const base = { primary: '#c4ac11' }
const vuetify = new Vuetify({ theme: { themes: { light: base, dark: base }}})

new Vue({
    store,
    vuetify,
    render: h => h(Sync)
}).$mount('#app')
