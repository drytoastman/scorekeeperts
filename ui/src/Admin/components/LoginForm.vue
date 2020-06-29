<template>
    <div class='formbox'>
        Need series password for <b>{{currentSeries}}</b>
        <v-text-field v-model="password" label="Password" required :type="pType" @click:append="showp=!showp" :append-icon="pIcon">
        </v-text-field>
        <v-btn :dark=dark color="primary" @click='login'>Login</v-btn>
    </div>
</template>

<script>
import { mapState } from 'vuex'
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
            password: ''
        }
    },
    computed: {
        ...mapState(['currentSeries'])
    },
    methods: {
        login: function() {
            this.$store.dispatch('serieslogin', {
                series: this.currentSeries,
                password: this.password
            })
        }
    }
}
</script>

<style scoped>
.formbox {
    max-width: 20rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 10px;
}
</style>
