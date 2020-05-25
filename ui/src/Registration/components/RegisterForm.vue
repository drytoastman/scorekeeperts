<template>
    <v-form ref="form" lazy-validation @submit.prevent="register">
        <Alert :error=error></Alert>
        <v-text-field v-model="firstname" label="First Name" required :rules="vrules.firstname"></v-text-field>
        <v-text-field v-model="lastname"  label="Last Name"  required :rules="vrules.lastname"></v-text-field>
        <v-text-field v-model="email"     label="Email"      required :rules="vrules.email"></v-text-field>
        <v-text-field v-model="username"  label="Username"   required :rules="vrules.username"></v-text-field>
        <v-text-field v-model="password"  label="Password"   required :rules="vrules.password"
                      :type="pType" @click:append="showp=!showp" :append-icon="pIcon">
        </v-text-field>
        <v-btn :dark=dark :color=color type="submit">Create New Profile</v-btn>
    </v-form>
</template>

<script>
import Alert from '../../components/Alert'
import { DriverValidator } from '@common/lib'
import { PasswordEyeMixin } from '../../components/PasswordEyeMixin.js'

export default {
    name: 'RegisterForm',
    mixins: [PasswordEyeMixin],
    components: {
        Alert
    },
    props: {
        dark: Boolean,
        color: String
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
        register: function() {
            if (!this.$refs.form.validate()) { return }
            this.$store.dispatch('regreset', {
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
