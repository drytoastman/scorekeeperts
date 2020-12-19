<template>
    <v-form ref="form" lazy-validation @submit.prevent="register">
        <v-text-field v-model="firstname" label="First Name" required :rules="vrules.firstname"></v-text-field>
        <v-text-field v-model="lastname"  label="Last Name"  required :rules="vrules.lastname"></v-text-field>
        <v-text-field v-model="email"     label="Email"      required :rules="vrules.email"></v-text-field>
        <v-text-field v-model="username"  label="Username"   required :rules="vrules.username"></v-text-field>
        <v-text-field v-model="password"  label="Password"   required :rules="vrules.password"
                      :type="pType" @click:append="showp=!showp" :append-icon="pIcon">
        </v-text-field>
        <v-btn v-if='ready' :dark=dark :color=color type="submit">Create New Profile</v-btn>
        <div v-else>Waiting for Captcha</div>
    </v-form>
</template>

<script>
import { RegisterValidator } from 'sctypes/driver'
import { PasswordEyeMixin } from '@/components/PasswordEyeMixin.js'

export default {
    name: 'RegisterForm',
    mixins: [PasswordEyeMixin],
    props: {
        dark: Boolean,
        color: String,
        ready: Boolean
    },
    data() {
        return {
            firstname: '',
            lastname: '',
            email: '',
            username: '',
            password: '',
            error: '',
            vrules: RegisterValidator
        }
    },
    methods: {
        register() {
            if (!this.$refs.form.validate()) { return }
            this.$emit('do-captcha', this.captchaComplete)
        },
        captchaComplete(token) {
            if (!token || !this.$refs.form.validate()) { return }
            this.$store.dispatch('register', {
                firstname: this.firstname,
                lastname: this.lastname,
                email: this.email,
                username: this.username,
                password: this.password,
                recaptcha: token
            }).then(data => {
                if (!data) return

                if (data.tokenresult) { // onsite direct registration
                    this.$store.commit('clearDriverData')
                    this.$store.commit('driverAuthenticated', true)
                    this.$store.dispatch('getdata')
                    this.$router.replace({ name: 'profile' })
                    return
                }

                if (data.emailresult) { // email was sent, let them know
                    this.$router.push({ name: 'emailresult' })
                    return
                }

                console.log(data)
                this.$store.commit('setErrors', ['unknown registration result'])
            })
        }
    }
}
</script>

<style scoped>
</style>
