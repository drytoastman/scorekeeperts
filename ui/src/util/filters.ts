import { VueConstructor } from 'vue'
import { DateString } from '@common/lib'

export function capitalize(v: string): string {
    if (!v) { return v }
    return v.charAt(0).toUpperCase() + v.slice(1)
}

function cents2dollars(v: number): string {
    if (typeof v !== 'number') return ''
    return `$${(v / 100).toFixed(2)}`
}

function dollars(v: number): string {
    if (typeof v !== 'number') return ''
    return `$${v.toFixed(2)}`
}

function dmdy(v: DateString): string {
    return new Date(v).toDateString()
}

export default {
    install(Vue: VueConstructor<Vue>): void {
        Vue.filter('capitalize', capitalize)
        Vue.filter('cents2dollars', cents2dollars)
        Vue.filter('dollars', dollars)
        Vue.filter('dmdy', dmdy)
    }
}
