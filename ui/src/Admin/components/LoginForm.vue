<template>
    <div class='outer'>
        <v-form @submit.prevent='loginseries' v-if='series' class='formbox'>
            Series Password For <b>{{series}}</b>
            <v-text-field v-model="seriespassword" label="Password" required :type="pType" @click:append="showp=!showp" :append-icon="pIcon">
            </v-text-field>
            <v-btn :dark=dark color="primary" @click="loginseries">Login</v-btn>
        </v-form>
        <div v-if='series && admin' class='or'>Or</div>
        <v-form @submit.prevent='loginadmin' v-if='admin' class='formbox'>
            System Admin Password
            <v-text-field v-model="adminpassword" label="Password" required :type="pType" @click:append="showp=!showp" :append-icon="pIcon">
            </v-text-field>
            <v-btn :dark=dark color="primary" @click="loginadmin">Login</v-btn>
        </v-form>
    </div>
</template>

<script>
import { PasswordEyeMixin } from '../../components/PasswordEyeMixin.js'

export default {
    name: 'LoginForm',
    mixins: [PasswordEyeMixin],
    props: {
        dark: Boolean,
        color: String,
        series: String,
        admin: Boolean
    },
    data() {
        return {
            seriespassword: '',
            adminpassword: ''
        }
    },
    methods: {
        loginseries: function() {
            this.$store.dispatch('serieslogin', {
                series: this.series,
                password: this.seriespassword
            })
        },
        loginadmin: function() {
            this.$store.dispatch('adminlogin', {
                password: this.adminpassword
            })
        }
    }
}
</script>

<style scoped>
.formbox {
    max-width: 25rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 10px;
}
.or {
    font-weight: bold;
    font-size: 120%;
    margin: 1rem;
}
@media (min-width: 760px) {
    .outer {
        display: grid;
        grid-template-columns: auto 5rem auto;
        align-items: center;
        justify-items: center;
    }
    .formbox {
        width: 100%;
        max-width: initial;
    }
    .or {
        margin: initial;
    }
}

</style>
