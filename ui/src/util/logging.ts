/* eslint-disable no-console */
import Vue from 'vue'

export function installLoggingHandlers() {
    window.onerror = function(message, filename, lineno) {
        console.log(`OnEr: ${filename}:${lineno}: ${message}`)
    }
    window.addEventListener('unhandledrejection', function(event) {
        console.log(`UnPr: ${event.reason}`)
        console.log(event.reason.stack)
    })
    Vue.config.errorHandler = err => {
        console.log(`VuEr: ${err}`)
        console.log(err.stack?.substring(0, 200))
    }
}
