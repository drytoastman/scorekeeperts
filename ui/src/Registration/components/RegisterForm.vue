<template>
    <v-form ref="form" lazy-validation @submit.prevent="captchaexecute">
        <Alert :error=error></Alert>
        <v-text-field v-model="firstname" label="First Name" required :rules="vrules.firstname"></v-text-field>
        <v-text-field v-model="lastname"  label="Last Name"  required :rules="vrules.lastname"></v-text-field>
        <v-text-field v-model="email"     label="Email"      required :rules="vrules.email"></v-text-field>
        <v-text-field v-model="username"  label="Username"   required :rules="vrules.username"></v-text-field>
        <v-text-field v-model="password"  label="Password"   required :rules="vrules.password"
                      :type="pType" @click:append="showp=!showp" :append-icon="pIcon">
        </v-text-field>
        <v-btn v-if='ready' :dark=dark :color=color type="submit">Create New Profile</v-btn>
        <div v-else>Waiting for Captcha</div>
        <div ref="captchadiv"></div>
    </v-form>
</template>

<script>
import Alert from '../../components/Alert'
import { DriverValidator } from '@/common/driver'
import { PasswordEyeMixin } from '../../components/PasswordEyeMixin.js'

export default {
    name: 'RegisterForm',
    mixins: [PasswordEyeMixin],
    components: {
        Alert
    },
    props: {
        dark: Boolean,
        color: String,
        recaptchaLoaded: Boolean,
        sitekey: String
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
    computed: {
        ready() { return this.recaptchaLoaded && this.sitekey }
    },
    methods: {
        captchaexecute: function() {
            grecaptcha.execute()
        },
        register: function(token) {
            if (!this.$refs.form.validate()) { return }
            this.$store.dispatch('register', {
                firstname: this.firstname,
                lastname: this.lastname,
                email: this.email,
                username: this.username,
                password: this.lastname,
                recaptcha: token
            }).then(() => {
                this.$router.push({ name: 'emailresult' })
            }).catch(e => {
                this.error = e.toString()
            })
        }
    },
    watch: {
        ready() {
            if (this.ready) {
                grecaptcha.render(this.$refs.captchadiv, {
                    sitekey : this.sitekey,
                    callback : this.register,
                    size: 'invisible'
                })
            }
        }
    }
}
</script>

<style scoped>
</style>
