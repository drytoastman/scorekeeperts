<template>
    <div class='centerwrap'>
        <v-tabs id="logintabs" v-model="active" background-color="primary" dark centered grow>
            <v-tab ripple>Login</v-tab>
            <v-tab ripple v-if="!skipCaptcha">Reset</v-tab>
            <v-tab ripple>Register</v-tab>
            <v-tab-item padding="1rem" eager>
                <LoginForm    color="primary" dark :ready=ready></LoginForm>
            </v-tab-item>
            <v-tab-item padding="1rem" eager v-if="!skipCaptcha">
                <ResetForm    color="primary" dark :ready=ready @do-captcha=doCaptcha ></ResetForm>
            </v-tab-item>
            <v-tab-item padding="1rem" eager>
                <RegisterForm color="primary" dark :ready=ready @do-captcha=doCaptcha></RegisterForm>
            </v-tab-item>
        </v-tabs>

        <div id='captchadiv'></div>
    </div>
</template>

<script>
import LoginForm from '../components/LoginForm'
import ResetForm from '../components/ResetForm'
import RegisterForm from '../components/RegisterForm'
import { ReCaptchaMixin } from '@/components/ReCaptchaMixin.js'

export default {
    name: 'Login',
    mixins: [ReCaptchaMixin],
    components: {
        LoginForm,
        ResetForm,
        RegisterForm
    },
    data() {
        return {
            active: null
        }
    }
}
</script>

<style>
.centerwrap {
    display: flex;
    justify-content: center;
}
#logintabs {
    max-width: 25rem;
    border: 1px solid #eee;
    border-radius: 2px;
}
.v-tabs-items {
    padding: 1rem;
}
</style>
