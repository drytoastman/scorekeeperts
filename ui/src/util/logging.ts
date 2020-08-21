import Vue from 'vue'

export function installLoggingHandlers(): void {
    window.onerror = function(message, filename, lineno) {
        console.log(`onerror: ${filename}:${lineno}: ${message}`)
    }
    window.addEventListener('unhandledrejection', function(event) {
        console.log(`unhandledrejection: ${JSON.stringify(event)}`)
        if (event.reason) console.log(event.reason.stack)
    })
    Vue.config.errorHandler = err => {
        console.log(`vueerror: ${err}`)
        console.log(err.stack?.substring(0, 500))
    }
}
