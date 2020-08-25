<template>
    <v-form ref="form" lazy-validation @submit.prevent="reset">
        <Alert :error=error></Alert>
        <v-text-field v-model="firstname" label="First Name" required :rules="vrules.firstname"></v-text-field>
        <v-text-field v-model="lastname"  label="Last Name"  required :rules="vrules.lastname"></v-text-field>
        <v-text-field v-model="email"     label="Email"      required :rules="vrules.email"></v-text-field>
        <v-btn :dark=dark :color=color type="submit">Send Reset Information</v-btn>
    </v-form>
</template>

<script>
import Alert from '../../components/Alert'
import { DriverValidator } from '../../common/driver'
export default {
    name: 'ResetForm',
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
            error: '',
            vrules: DriverValidator
        }
    },
    methods: {
        reset: function() {
            if (!this.$refs.form.validate()) { return }
            this.$store.dispatch('reset', {
                firstname: this.firstname,
                lastname: this.lastname,
                email: this.email
            }).then(() => {
                this.$router.push({ name: 'emailresult' })
            }).catch(e => {
                this.error = e.toString()
            })
        }
    }
}
</script>

<style scoped>
</style>
