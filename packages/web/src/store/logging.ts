import { Api2State } from './state'
import Vue from 'vue'
import { Store } from 'vuex'

export function installLoggingHandlers(store: Store<Api2State>): void {
    window.onerror = function(message, filename, lineno) {
        const msg = `window error: ${filename}:${lineno}: ${message}`
        store.commit('addErrors', [msg])
        console.log(msg)
    }

    window.addEventListener('unhandledrejection', function(event) {
        const msg = `unhandledrejection: ${JSON.stringify(event)}`
        const keys = Object.keys(event)
        if (keys.length === 1 &&  keys[0] === 'isTrusted') {  // { isTrusted: true }
            // don't bother user with useless errors from failed library gets
            store.commit('addErrors', [msg])
        }
        console.log(msg)
        if (event.reason) console.log(event.reason.stack)
    })

    Vue.config.errorHandler = err => {
        const msg = `vueerror: ${err}`
        store.commit('addErrors', [msg])
        console.log(msg)
        console.log(err.stack?.substring(0, 500))
    }
}
