import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import colors from 'vuetify/es5/util/colors'
import 'typeface-roboto'

import Admin from './Admin.vue'
import router from './router'
import { createAdminStore } from '../store'
import filters from '../util/filters'

Vue.use(filters)
Vue.use(Vuetify)

const base = {
    primary: '#465146',
    secondary: '#478841',
    accent: colors.lime.base,
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
        },
        options: {
            customProperties: true
        }
    },
    icons: {
        iconfont: 'mdiSvg'
    }
})

const store = createAdminStore(router)

new Vue({
    router,
    store,
    vuetify,
    render: h => h(Admin)
}).$mount('#app')
