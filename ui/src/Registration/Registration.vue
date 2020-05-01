<template>
    <v-app fluid>
        <v-navigation-drawer v-model="drawer" v-if="authenticated" app>
            <v-list dense>
                <v-list-item link>
                    <v-list-item-action>
                        <v-icon>mdi-home</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>Home</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <v-list-item link @click="logout">
                    <v-list-item-action>
                        <v-icon>mdi-contact-mail</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>Logout</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </v-list>
        </v-navigation-drawer>

        <v-app-bar app dark color='primary' v-if="authenticated">
            <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
            <v-toolbar-title>Scorekeeper Registration</v-toolbar-title>
        </v-app-bar>

        <v-content>
            <Alert :errors=errors></Alert>
            <router-view />
        </v-content>
    </v-app>
</template>

<script>
import { mapState } from 'vuex'
import Alert from '../components/Alert'

export default {
    name: 'App',
    components: {
        Alert
    },
    props: {
        source: String
    },
    data: () => ({
        drawer: null
    }),
    methods: {
        logout: function () {
            this.$store.dispatch('register/logout')
        }
    },
    computed: {
        ...mapState('register', ['authenticated', 'errors'])
    },
    watch: {
        authenticated: function (newv) {
            // tristate with blank string to get initial state
            if (newv === false) {
                this.$router.replace('/login')
            } else if (newv === true) {
                if (this.$route.path !== '/series/nwr2020') {
                    this.$router.replace('/series/nwr2020')
                }
            }
        }
    }
}
</script>

<style>
</style>
