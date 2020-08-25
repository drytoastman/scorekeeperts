<template>
    <v-form ref="form" lazy-validation @submit.prevent="login">
        <v-text-field v-model="username" label="Username" :rules="vrules.username" required></v-text-field>
        <v-text-field v-model="password" label="Password" :rules="vrules.password" required
                      :type="pType" @click:append="showp=!showp" :append-icon="pIcon">
        </v-text-field>
        <v-btn v-if=ready :dark=dark :color=color type="submit">Login</v-btn>
        <div v-else>Waiting for Captcha</div>
    </v-form>
</template>

<script>
import { DriverValidator } from '@/common/driver'
import { PasswordEyeMixin } from '@/components/PasswordEyeMixin.js'

export default {
    name: 'LoginForm',
    mixins: [PasswordEyeMixin],
    props: {
        dark: Boolean,
        color: String,
        ready: Boolean,
        recaptchaToken: String
    },
    data() {
        return {
            username: '',
            password: '',
            error: '',
            vrules: DriverValidator
        }
    },
    methods: {
        login() {
            if (!this.$refs.form.validate()) { return }
            this.$emit('doCaptcha', this.captchaComplete)
        },
        captchaComplete(token) {
            if (!token || !this.$refs.form.validate()) { return }
            this.$store.dispatch('login', {
                username: this.username,
                password: this.password,
                recaptcha: token
            })
        }
    }
}
</script>

<style scoped>
</style>
