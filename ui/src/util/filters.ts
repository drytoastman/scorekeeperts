import { VueConstructor } from 'vue'

function capitalize(v: string) {
    return v.charAt(0).toUpperCase() + v.slice(1)
}

function dollars(v: string) {
    if (typeof v !== 'number') return ''
    return `$${(v / 100).toFixed(2)}`
}

export default {
    install(Vue: VueConstructor<Vue>) {
        Vue.filter('capitalize', capitalize)
        Vue.filter('dollars', dollars)
    }
}
