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
import { DriverValidator } from '@/common/driver'
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
            vrules: DriverValidator
        }
    },
    methods: {
        register() {
            if (!this.$refs.form.validate()) { return }
            this.$emit('doCaptcha', this.captchaComplete)
        },
        captchaComplete(token) {
            if (!token || !this.$refs.form.validate()) { return }
            this.$store.dispatch('register', {
                firstname: this.firstname,
                lastname: this.lastname,
                email: this.email,
                username: this.username,
                password: this.lastname,
                recaptcha: token
            }).then(data => {
                if (data) this.$router.push({ name: 'emailresult' })
            })
        }
    }
}
</script>

<style scoped>
</style>
