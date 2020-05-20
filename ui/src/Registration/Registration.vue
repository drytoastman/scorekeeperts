<template>
    <v-app fluid>
        <v-navigation-drawer v-if="authenticated" v-model="drawer" app>
            <div class='drawerheader'>Scorekeeper</div>
            <v-list dense>
                <v-list-item to="profile" link>
                    <v-list-item-action><v-icon color=blue>{{profileicon}}</v-icon></v-list-item-action>
                    <v-list-item-content><v-list-item-title>Profile</v-list-item-title></v-list-item-content>
                </v-list-item>
                <v-list-item link @click="logout">
                    <v-list-item-action><v-icon>{{logouticon}}</v-icon></v-list-item-action>
                    <v-list-item-content><v-list-item-title>Logout</v-list-item-title></v-list-item-content>
                </v-list-item>
                <v-divider style="margin:1rem;"></v-divider>
                <v-list-item>
                    <v-select label="Series" :items="serieslist" v-model="selectedSeries" outlined dense hide-details>
                    </v-select>
                </v-list-item>
                <v-list-item to="events" link>
                    <v-list-item-action><v-icon color=orange>{{eventsicon}}</v-icon></v-list-item-action>
                    <v-list-item-content><v-list-item-title>Events</v-list-item-title></v-list-item-content>
                </v-list-item>
                <v-list-item to="cars" link>
                    <v-list-item-action><v-icon color=black>{{carsicon}}</v-icon></v-list-item-action>
                    <v-list-item-content><v-list-item-title>Cars</v-list-item-title></v-list-item-content>
                </v-list-item>

            </v-list>
        </v-navigation-drawer>

        <v-app-bar app dense dark color='primary'>
            <v-app-bar-nav-icon v-if="authenticated" @click.stop="drawer = !drawer" />
            <v-toolbar-title>{{displayName}}</v-toolbar-title>
            <v-spacer></v-spacer>
        </v-app-bar>

        <v-content>
            <router-view v-if="authenticated" />
            <Login v-else-if="authenticated===false"></Login>
            <div v-else class='pushdown loading'>Loading Data ...</div>
        </v-content>

        <v-snackbar v-model="snackbar" :timeout=0>
            <div v-for="error in errors" :key="error">
                {{ error }}
            </div>
            <v-btn color="pink" text @click="errorclose">Close</v-btn>
        </v-snackbar>
    </v-app>
</template>

<script>
import { mapState } from 'vuex'
import { mdiAccount, mdiCar, mdiTrafficCone, mdiLogout } from '@mdi/js'
import { capitalize } from '../util/filters'
import Login from './views/login'

export default {
    name: 'App',
    components: {
        Login
    },
    data: () => ({
        drawer: null,
        snackbar: false,
        profileicon: mdiAccount,
        eventsicon: mdiTrafficCone,
        carsicon: mdiCar,
        logouticon: mdiLogout
    }),
    methods: {
        logout: function() {
            this.$store.dispatch('logout')
        },
        errorclose: function() {
            // this.snackbar = false
            this.$store.commit('clearErrors')
        }
    },
    computed: {
        ...mapState(['serieslist', 'authenticated', 'errors']),
        displayName() {
            let name = 'Scorekeeper'
            switch (this.$vuetify.breakpoint.name) {
                case 'xs': break
                default:
                    name += ' Registration'
                    break
            }

            if (this.$route.name && !['login'].includes(this.$route.name) && (this.authenticated === true)) {
                name += ` / ${this.$store.state.route.params.series} / ${capitalize(this.$route.name)}`
                /*
                if (this.$store.state.route.params && this.$store.state.route.params.series) {
                    name += ` (${this.$store.state.route.params.series})`
                } */
            }

            return name
        },
        selectedSeries: {
            get() {
                return this.$store.state.route.params.series
            },
            set(value) {
                this.$router.push({ name: this.$route.name, params: { series: value } })
            }
        }
    },
    watch: {
        authenticated: function(newv) {
            console.log(`auth ${newv}`)
            if (newv === false) {
                this.drawer = false // close as it was open during logout
            }
        },
        errors: function(newv) {
            this.snackbar = newv.length > 0
        }
    }
}
</script>

<style lang='scss'>
.drawerheader {
     text-align: center;
     font-size: 120%;
     margin-top: 1rem;
     border-bottom: 1px solid gray;
}
.loading {
    font-size: 150%;
    text-align: center;
}
.pushdown {
    margin-top: calc(15vh);
}
@import '@/styles/general.scss'
</style>
