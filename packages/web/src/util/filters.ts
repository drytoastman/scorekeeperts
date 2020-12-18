import { VueConstructor } from 'vue'
import { DateString, parseDate } from 'sctypes/lib/util'

export function capitalize(v: string): string {
    if (!v) { return v }
    return v.charAt(0).toUpperCase() + v.slice(1)
}

function cents2dollars(v: number): string {
    if (typeof v !== 'number') return ''
    return `$${(v / 100).toFixed(2)}`
}

export function t3(v: number): string {
    if (typeof v !== 'number') return ''
    return v.toFixed(3)
}

export function dmdy(v: DateString): string {
    return parseDate(v).toDateString()
}

function lenlimit(v: string, limit: number) {
    if (v.length > limit) {
        return v.substr(0, limit - 3) + '...'
    }
    return v
}

export default {
    install(Vue: VueConstructor<Vue>): void {
        Vue.filter('capitalize', capitalize)
        Vue.filter('cents2dollars', cents2dollars)
        Vue.filter('t3', t3)
        Vue.filter('dmdy', dmdy)
        Vue.filter('lenlimit', lenlimit)
    }
}
