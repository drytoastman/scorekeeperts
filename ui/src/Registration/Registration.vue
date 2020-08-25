<template>
    <v-app fluid>
        <v-navigation-drawer v-model="drawer" app >
            <v-list dense>
                <v-list-item>
                    <v-list-item-content>
                    <v-list-item-title class="title" style="overflow:visible">
                        Scorekeeper
                    </v-list-item-title>
                    <v-list-item-subtitle>
                        Registration
                    </v-list-item-subtitle>
                    </v-list-item-content>
                </v-list-item>

                <v-divider></v-divider>
                <v-subheader class='ndsh'>General</v-subheader>

                <v-list-item v-if="currentSeries" :to="{name:'profile', params:{}}" link>
                    <v-list-item-action><v-icon color=blue>{{profileicon}}</v-icon></v-list-item-action>
                    <v-list-item-content><v-list-item-title>Profile</v-list-item-title></v-list-item-content>
                </v-list-item>
                <v-list-item link @click="logout">
                    <v-list-item-action><v-icon>{{logouticon}}</v-icon></v-list-item-action>
                    <v-list-item-content><v-list-item-title>Logout</v-list-item-title></v-list-item-content>
                </v-list-item>

                <v-divider></v-divider>
                <v-subheader class='ndsh'>Series Specific</v-subheader>

                <v-list-item>
                    <v-list-item-content>
                        <v-select :items="serieslist" v-model="selectedSeries" solo dense hide-details placeholder="Select A Series" ref="sselect"></v-select>
                    </v-list-item-content>
                </v-list-item>
                <v-list-item v-if="currentSeries" :to="{name:'events', params:{series:currentSeries}}" link>
                    <v-list-item-action><v-icon color=orange>{{eventsicon}}</v-icon></v-list-item-action>
                    <v-list-item-content><v-list-item-title>Events</v-list-item-title></v-list-item-content>
                </v-list-item>
                <v-list-item v-if="currentSeries" :to="{name:'cars', params:{series:currentSeries}}" link>
                    <v-list-item-action><v-icon color=black>{{carsicon}}</v-icon></v-list-item-action>
                    <v-list-item-content><v-list-item-title>Cars</v-list-item-title></v-list-item-content>
                </v-list-item>
            </v-list>
        </v-navigation-drawer>

        <v-app-bar app dense dark color='primary' v-if="!isEmailResult">
            <v-app-bar-nav-icon @click.stop="drawer = !drawer" :disabled="!driverAuthenticated" />
            <v-toolbar-title>{{displayName}}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-progress-linear :active="!!gettingData" indeterminate absolute bottom color="green accent-4"></v-progress-linear>
        </v-app-bar>

        <v-main>
            <div v-if="loadDelay && !$route.name" class='pushdown main-page-warning'>Unknown Page</div>
            <router-view v-else-if="driverAuthenticated || isEmailResult" />
            <Login v-else-if="driverAuthenticated===false"></Login>
        </v-main>

        <v-snackbar :value="snackbar" :timeout=-1>
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
import Login from './views/login'

export default {
    name: 'App',
    components: {
        Login
    },
    data: () => ({
        drawer: null,
        profileicon: mdiAccount,
        eventsicon: mdiTrafficCone,
        carsicon: mdiCar,
        logouticon: mdiLogout,
        loadDelay: false
    }),
    methods: {
        logout: function() {
            this.$store.dispatch('logout')
            this.drawer = false
        },
        errorclose: function() {
            this.$store.commit('clearErrors')
        }
    },
    computed: {
        ...mapState(['currentSeries', 'serieslist', 'driverAuthenticated', 'errors', 'gettingData']),
        snackbar() { return this.errors.length > 0 },
        isEmailResult() { return this.$route.name === 'emailresult' },
        displayName() {
            if (!this.driverAuthenticated) { return 'Registration' }
            return `Registration${this.$route.path}`.replace(/\//g, ' / ')
        },
        selectedSeries: {
            get() { return this.currentSeries },
            set(value) {
                this.$store.commit('changeSeries', value)
                this.$router.push({ name: this.$route.name, params: { series: value } }).catch(error => {
                    // If we change series while on a non-series link, don't throw any errors
                    if (error.name !== 'NavigationDuplicated') {
                        throw error
                    }
                })
            }
        }
    },
    watch: {
        drawer: function(newv) {
            if ((newv) && (!this.currentSeries)) {
                this.$refs.sselect.activateMenu() // show menu if nothing is selected
            }
        },
        serieslist: function() {
            if (this.currentSeries) {
                this.$refs.sselect.blur() // clear after load if it doesn't need to be open
            }
        }
    },
    mounted() {
        console.log('mounted getdata')
        this.$store.dispatch('getdata')
        setTimeout(() => { this.loadDelay = true }, 3000)
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
.main-page-warning {
    font-size: 150%;
    text-align: center;
}
.v-list-item--active {
    filter: grayscale(60%) opacity(40%);
    pointer-events: none;
}
.pushdown {
    margin-top: calc(15vh);
}
@import '@/styles/general.scss'
</style>
