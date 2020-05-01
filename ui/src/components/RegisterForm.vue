<template>
    <v-form ref="form" lazy-validation @submit.prevent="register">
        <Alert :error=error></Alert>
        <v-text-field v-model="firstname" label="First Name" required :rules="vrules.firstname"></v-text-field>
        <v-text-field v-model="lastname"  label="Last Name"  required :rules="vrules.lastname"></v-text-field>
        <v-text-field v-model="email"     label="Email"      required :rules="vrules.email"></v-text-field>
        <v-text-field v-model="username"  label="Username"   required :rules="vrules.username"></v-text-field>
        <v-text-field v-model="password"  label="Password"   required :rules="vrules.password"
            :type="showp?'text':'password'" @click:append="showp=!showp" :append-icon="showp?'mdi-eye':'mdi-eye-off'">
        </v-text-field>
        <v-btn :dark=dark :color=color type="submit">Create New Profile</v-btn>
    </v-form>
</template>

<script>
import Alert from '../components/Alert'
import { DriverValidator } from '@common/lib'
export default {
    name: 'RegisterForm',
    components: {
        Alert
    },
    props: {
        dark: Boolean,
        color: String
    },
    data () {
        return {
            firstname: '',
            lastname: '',
            email: '',
            username: '',
            password: '',
            error: '',
            showp: false,
            vrules: DriverValidator
        }
    },
    methods: {
        register: function () {
            if (!this.$refs.form.validate()) { return }
            this.$store.dispatch('register/regreset', {
                type: 'register',
                firstname: this.firstname,
                lastname: this.lastname,
                email: this.email,
                username: this.username,
                password: this.lastname
            }).then(() => {
                this.$router.push('emailresult')
            }).catch(e => {
                this.error = e.toString()
            })
        }
    }
}
</script>

<style scoped>
</style>
