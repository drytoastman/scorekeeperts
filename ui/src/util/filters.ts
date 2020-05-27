import { VueConstructor } from 'vue'
import { DateString } from '@common/lib'

export function capitalize(v: string) {
    if (!v) { return v }
    return v.charAt(0).toUpperCase() + v.slice(1)
}

function dollars(v: string) {
    if (typeof v !== 'number') return ''
    return `$${(v / 100).toFixed(2)}`
}

function dmdy(v: DateString) {
    return new Date(v).toDateString()
}

export default {
    install(Vue: VueConstructor<Vue>) {
        Vue.filter('capitalize', capitalize)
        Vue.filter('dollars', dollars)
        Vue.filter('dmdy', dmdy)
    }
}
