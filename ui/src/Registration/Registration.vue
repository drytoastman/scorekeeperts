<template>
    <v-app fluid>
        <v-app-bar v-if="driverAuthenticated" app height=45 extension-height=35 dark color="primary">
            <span class='btitle'>Registration</span>
            <v-select :items="serieslist" v-model="selectedSeries" solo light dense hide-details placeholder="Select A Series" ref="sselect"></v-select>
            <span class='bdesc'>{{$route.meta.marker || $route.name}}</span>

            <template v-slot:extension>
                <v-btn color=white text small exact :to="{name:'profile', params:{}}">Profile<span>All</span></v-btn>
                <v-btn color=white text small exact :to="{name:'cars',    params:{series:currentSeries}}" :disabled="!currentSeries">Cars</v-btn>
                <v-btn color=white text small exact :to="{name:'events',  params:{series:currentSeries}}" :disabled="!currentSeries">Events</v-btn>
                <v-btn color=white text small @click='logout'>Logout</v-btn>
                <v-progress-linear :active="!!gettingData" indeterminate absolute bottom color="green accent-4"></v-progress-linear>
            </template>

        </v-app-bar>

        <v-main>
            <div v-if="loadDelay && !$route.name" class='pushdown main-page-warning'>Unknown Page</div>
            <router-view v-else-if="driverAuthenticated || isOutside" />
            <Login v-else-if="driverAuthenticated===false" class='pushdown'></Login>
        </v-main>

        <v-snackbar :value="snackbar" :timeout=-1>
            <div v-for="error in filteredErrors" :key="error">
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
        snackbar()  { return this.filteredErrors.length > 0 },
        isOutside() { return this.$route.meta.outside === 1 },
        filteredErrors() { return this.errors.filter(s => s !== 'not authenticated') },

        selectedSeries: {
            get() { return this.currentSeries },
            set(value) {
                this.$store.commit('changeSeries', value)
                this.$router.push({ name: this.$route.name, params: { series: value }}).catch(error => {
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
.main-page-warning {
    font-size: 150%;
    text-align: center;
}
.pushdown {
    margin-top: calc(15vh);
}
.v-btn__content > span {
    text-transform: initial;
    font-size: 80%;
    margin-left: 3px;
    margin-bottom: 10px;
}
@import '@/styles/general.scss'
</style>
