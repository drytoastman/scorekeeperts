import Vue from 'vue'

/* If recaptcha V2 had working promises, this would be much simpler */

const RECAPTCHAURL = 'https://www.google.com/recaptcha/api.js?onload=captchaLoadedEvent&render=explicit'
export const ReCaptchaMixin = {
    data() {
        return {
            sitekey: '',
            loaded: false,
            componentCallback: undefined
        }
    },
    methods: {
        captchaLoaded() {
            this.loaded = true
        },
        doCaptcha(callback) {
            // we redirect the callback to use a single captcha div and avoid mess of events and props
            this.componentCallback = callback
            grecaptcha.execute()
        }
    },
    computed: {
        ready() { return this.loaded && this.sitekey.length > 10 }
    },
    watch: {
        ready(newv) {
            if (newv) {
                grecaptcha.render('captchadiv', {
                    sitekey: this.sitekey,
                    callback: (token) => { this.componentCallback(token); grecaptcha.reset() },
                    size: 'invisible'
                })
            }
        }
    },
    mounted() {
        this.$store.dispatch('getdata', { items: 'recaptchasitekey' }).then(data => {
            if (data) this.sitekey = data.recaptchasitekey
        })
        if ((window.captchaLoadedEvent) && (window.captchaLoadedEvent !== this.captchaLoaded)) {
            console.warn('captchaLoadedEvent will be overwritten')
        }
        // allow script to use a generic function pointer to call our stuff
        window.captchaLoadedEvent = this.captchaLoaded
        Vue.loadScript(RECAPTCHAURL)
    },
    destroyed() {
        this.captchaSiteKey = ''
        this.captchaLoaded = false
        delete window.captchaLoadedEvent
        Vue.unloadScript(RECAPTCHAURL)
    }
}
