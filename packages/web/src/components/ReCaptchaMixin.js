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
        doCaptcha(componentCallback) {
            // we redirect the callback to use a single captcha div and avoid mess of events and props
            if (this.skipCaptcha) {
                componentCallback('skippingskippingskippingskippingskippingskippingskippingskipping')
            } else {
                this.componentCallback = componentCallback
                grecaptcha.execute()
            }
        },
        loadCaptcha() {
            if ((window.captchaLoadedEvent) && (window.captchaLoadedEvent !== this.captchaLoaded)) {
                console.warn('captchaLoadedEvent will be overwritten')
            }
            // allow script to use a generic function pointer to call our stuff
            window.captchaLoadedEvent = this.captchaLoaded
            Vue.loadScript(RECAPTCHAURL)
        },
        captchaLoaded() {
            this.loaded = true
            grecaptcha.render('captchadiv', {
                sitekey: this.sitekey,
                callback: (token) => { this.componentCallback(token); grecaptcha.reset() },
                size: 'invisible'
            })
        },
        unloadCaptcha() {
            this.captchaSiteKey = ''
            this.captchaLoaded = false
            delete window.captchaLoadedEvent
            if (this.loaded) Vue.unloadScript(RECAPTCHAURL)
        }
    },
    computed: {
        skipCaptcha()  { return this.sitekey === 'norecaptcha' },
        ready() { return this.skipCaptcha || (this.loaded && this.sitekey.length > 10) }
    },
    mounted() {
        this.$store.dispatch('getdata', { items: 'recaptchasitekey' }).then(data => {
            if (data) {
                this.sitekey = data.recaptchasitekey
                if (!this.skipCaptcha) this.loadCaptcha()
            }
        })
    },
    destroyed() {
        if (!this.skipCaptcha) this.unloadCaptcha()
    }
}
