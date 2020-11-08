import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import colors from 'vuetify/es5/util/colors'
import 'typeface-roboto'

import Live from './Live.vue'
import router from './router'
import store from './store'
import filters from '@/util/filters'
import { Route } from 'vue-router'

Vue.use(filters)
Vue.use(Vuetify)

const base = {
    primary: '#465146',
    secondary: '#478841',
    accent: '#799d8e',
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

router.beforeResolve(function(to: Route, from: Route, next): void {
    store.dispatch('newRouteParam', to.params)
    next()
})

new Vue({
    router,
    store,
    vuetify,
    render: h => h(Live)
}).$mount('#app')
