import Vue from 'vue'
import Registration from './Registration.vue'
import router from './router'
import store from './store'
import Vuetify from 'vuetify/lib'
import colors from 'vuetify/es5/util/colors'
import { installLoggingHandlers } from '@/util/logging'

installLoggingHandlers()
Vue.use(Vuetify)
const base = {
    primary: colors.indigo.base,
    secondary: colors.blue.base,
    accent: colors.cyan.base,
    error: colors.red.base,
    warning: colors.orange.base,
    info: colors.blueGrey.base,
    success: colors.green.base
}
const vuetify = new Vuetify({
    theme: {
        themes: {
            light: base,
            dark: base
        }
    }
})

new Vue({
    router,
    store,
    vuetify,
    render: h => h(Registration)
}).$mount('#app')
