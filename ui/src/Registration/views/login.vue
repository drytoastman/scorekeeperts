<template>
    <v-container fluid>
        <v-row class="pushdown" justify="center">
            <v-tabs id="logintabs" v-model="active" background-color="primary" dark centered grow>
                <v-tab ripple>Login</v-tab>
                <v-tab ripple>Reset</v-tab>
                <v-tab ripple>Register</v-tab>
                <v-tab-item padding="1rem"><LoginForm color="primary" dark></LoginForm></v-tab-item>
                <v-tab-item padding="1rem"><ResetForm color="primary" dark></ResetForm></v-tab-item>
                <v-tab-item padding="1rem" eager>
                    <RegisterForm color="primary" dark :recaptchaLoaded='recaptchaLoaded' :sitekey='sitekey'></RegisterForm>
                </v-tab-item>
            </v-tabs>
        </v-row>
    </v-container>
</template>

<script>
import Vue from 'vue'
import LoginForm from '../components/LoginForm'
import ResetForm from '../components/ResetForm'
import RegisterForm from '../components/RegisterForm'
const RECAPTCHAURL = 'https://www.google.com/recaptcha/api.js?onload=captchaLoadedEvent&render=explicit'

export default {
    name: 'Login',
    components: {
        LoginForm,
        ResetForm,
        RegisterForm
    },
    data() {
        return {
            active: null,
            recaptchaLoaded: false,
            sitekey: ''
        }
    },
    methods: {
        captchaLoadedEvent() {
            this.recaptchaLoaded = true
        }
    },
    mounted() {
        this.$store.dispatch('getdata', { items: 'recaptchasitekey' }).then(data => {
            if (data) this.sitekey = data.recaptchasitekey
        })
        Object.assign(window, { captchaLoadedEvent: this.captchaLoadedEvent }) // tie in for below url
        Vue.loadScript(RECAPTCHAURL)
    },
    destroyed() {
        this.recaptchaLoaded = false
        Vue.unloadScript(RECAPTCHAURL).catch(error => { console.log(error) })
    }
}
</script>

<style>
#logintabs {
    max-width: 25rem;
    border: 1px solid #eee;
    border-radius: 2px;
}
.v-tabs-items {
    padding: 1rem;
}
</style>
