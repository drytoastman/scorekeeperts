<template>
    <v-container fluid class="fill-height">
        <v-row align="center" justify="center">
            <v-tabs id="logintabs" v-model="active" background-color="primary" dark centered grow>
                <v-tab ripple>Login</v-tab>
                <v-tab ripple>Reset</v-tab>
                <v-tab ripple>Register</v-tab>
                <v-tab-item padding="1rem"><LoginForm color="primary" dark></LoginForm></v-tab-item>
                <v-tab-item padding="1rem"><ResetForm color="primary" dark></ResetForm></v-tab-item>
                <v-tab-item padding="1rem"><RegisterForm color="primary" dark></RegisterForm></v-tab-item>
            </v-tabs>
        </v-row>
    </v-container>
</template>

<script>
import LoginForm from '../../components/LoginForm'
import ResetForm from '../../components/ResetForm'
import RegisterForm from '../../components/RegisterForm'
export default {
    name: 'Login',
    components: {
        LoginForm,
        ResetForm,
        RegisterForm
    },
    data () {
        return {
            active: null
        }
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
