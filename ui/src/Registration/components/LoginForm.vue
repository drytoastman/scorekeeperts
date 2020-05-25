<template>
    <v-form ref="form" lazy-validation @submit.prevent="login">
        <v-text-field v-model="username" label="Username" :rules="vrules.username" required></v-text-field>
        <v-text-field v-model="password" label="Password" :rules="vrules.password" required
                      :type="pType" @click:append="showp=!showp" :append-icon="pIcon">
        </v-text-field>
        <v-btn :dark=dark :color=color type="submit">Login</v-btn>
    </v-form>
</template>

<script>
import { DriverValidator } from '@common/lib'
import { PasswordEyeMixin } from '../../components/PasswordEyeMixin.js'

export default {
    name: 'LoginForm',
    mixins: [PasswordEyeMixin],
    props: {
        dark: Boolean,
        color: String
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
        login: function() {
            if (!this.$refs.form.validate()) { return }
            this.$store.dispatch('login', {
                username: this.username,
                password: this.password
            })
        }
    }
}
</script>

<style scoped>
</style>
