import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import colors from 'vuetify/es5/util/colors'
import LoadScript from 'vue-plugin-load-script'
import 'typeface-roboto'

import Registration from './Registration.vue'
import router from './router'
import { createRegisterStore } from '@/store'
import { installLoggingHandlers } from '@/util/logging'
import filters from '@/util/filters'

installLoggingHandlers()
Vue.use(filters)
Vue.use(LoadScript)
Vue.use(Vuetify)

declare module 'vue/types/vue' {
    interface VueConstructor<V extends Vue = Vue> {
        loadScript: any;
        unloadScript: any;
    }
}

const base = {
    primary: '#465146',
    secondary: '#478841',
    /*
    primary: colors.indigo.base,
    secondary: colors.blue.base, */
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
        },
        options: {
            customProperties: true
        }
    },
    icons: {
        iconfont: 'mdiSvg'
    }
})

const store = createRegisterStore(router)

new Vue({
    router,
    store,
    vuetify,
    render: h => h(Registration)
}).$mount('#app')
