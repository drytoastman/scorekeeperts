<template>
    <v-form ref="form" lazy-validation @submit.prevent="reset">
        <v-text-field v-model="firstname" label="First Name" required :rules="vrules.firstname"></v-text-field>
        <v-text-field v-model="lastname"  label="Last Name"  required :rules="vrules.lastname"></v-text-field>
        <v-text-field v-model="email"     label="Email"      required :rules="vrules.email"></v-text-field>
        <v-btn v-if='ready' :dark=dark :color=color type="submit">Send Reset Information</v-btn>
        <div v-else>Waiting for Captcha</div>
    </v-form>
</template>

<script>
import { ResetValidator } from '@sctypes/driver'

export default {
    name: 'ResetForm',
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
            error: '',
            vrules: ResetValidator
        }
    },
    methods: {
        reset() {
            if (!this.$refs.form.validate()) { return }
            this.$emit('do-captcha', this.captchaComplete)
        },
        captchaComplete(token) {
            if (!token || !this.$refs.form.validate()) { return }
            this.$store.dispatch('reset', {
                firstname: this.firstname,
                lastname: this.lastname,
                email: this.email,
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
