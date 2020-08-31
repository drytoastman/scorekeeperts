<template>
    <v-app fluid>
        <v-app-bar app height=45 extension-height=35 dark color="primary">
            <span class='btitle'>Admin</span>
            <v-select :items="serieslist" v-model="selectedSeries" solo light dense hide-details placeholder="Select A Series" ref="sselect"></v-select>
            <span class='bdesc'>{{$route.meta.marker || $route.name}}</span>

            <template v-slot:extension>
                <AdminMenu :items="eventMenu" text="event"    :disabled="!currentSeries"></AdminMenu>
                <AdminMenu :items="settings"  text="settings" :disabled="!currentSeries"></AdminMenu>
                <AdminMenu :items="reports"   text="reports"  :disabled="!currentSeries"></AdminMenu>
                <AdminMenu :items="admins"    text="admin"></AdminMenu>
                <v-btn color=white text small @click='logout'>Logout</v-btn>
                <v-progress-linear :active="!!gettingData" indeterminate absolute bottom color="green accent-4"></v-progress-linear>
            </template>

        </v-app-bar>

        <v-main>
            <div v-if="!$route.name" class="pushdown main-page-warning">Unknown Page</div>
            <router-view v-else-if="haveAuth || $route.name === 'noseries'" />
            <v-container v-else-if="!haveAuth">
                <LoginForm :series="this.$route.meta.adminauth ? null : currentSeries" :admin=true></LoginForm>
            </v-container>
        </v-main>

        <v-snackbar :value="snackbar" :timeout="-1">
            <div v-for="error in errors" :key="error">{{ error }}</div>
            <v-btn color="pink" text @click="errorclose">Close</v-btn>
        </v-snackbar>
    </v-app>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { mdiCog, mdiFlagCheckered, mdiAccountHardHat, mdiAccountCowboyHat, mdiFileTable } from '@mdi/js'
import LoginForm from './components/LoginForm'
import AdminMenu from './components/AdminMenu'

export default {
    name: 'Admin',
    components: {
        LoginForm,
        AdminMenu
    },
    data: () => ({
        icons: {
            mdiCog,
            mdiFlagCheckered,
            mdiAccountHardHat,
            mdiAccountCowboyHat,
            mdiFileTable
        }
    }),
    methods: {
        errorclose: function() {
            this.$store.commit('clearErrors')
        },
        logout: function() {
            this.$store.dispatch('logout')
        }
    },
    computed: {
        ...mapState(['adminAuthenticated', 'seriesAuthenticated', 'currentSeries', 'serieslist', 'events', 'errors', 'gettingData']),
        ...mapGetters(['haveAuth', 'orderedEvents']),
        snackbar() { return this.errors.length > 0 },
        selectedSeries: {
            get() {
                return this.currentSeries
            },
            set(value) {
                this.$store.commit('changeSeries', value)
                const name = this.$route.name === 'noseries' ? 'summary' : this.$route.name
                // const r = this.$router.matcher.match(name)
                // if (!('series' in r.params)) return

                this.$router.push({ name: name, params: { series: value }}).catch(error => {
                    console.log(error)
                })
            }
        },
        eventMenu() {
            return this.orderedEvents.map(e => ({
                title: e.name,
                link: {
                    name: 'event',
                    params: { eventid: e.eventid }
                }
            }))
        },
        haveAuth() {
            // const r = this.$router.matcher.match(this.$route.name)
            if (this.$route.meta.adminauth) {
                return this.adminAuthenticated
            }
            return this.seriesAuthenticated[this.currentSeries] || this.adminAuthenticated
        },
        settings() {
            if (!this.currentSeries) { return [] }
            return [
                { title: 'Settings', link: { name:'settings' }},
                { title: 'Classes',  link: { name:'classes' }},
                { title: 'Indexes',  link: { name:'indexes' }},
                { title: 'Accounts', link: { name:'accounts' }}
            ].map(v => { v.link.params = { series: this.currentSeries }; return v })
        },
        reports() {
            if (!this.currentSeries) { return [] }
            return  [
                { title: 'Series Attendance',    link: { name:'attendseries' }},
                { title: 'Events Attendance',    link: { name:'attendevent' }},
                { title: 'Unique Attendance',    link: { name:'attendunique' }},
                { title: 'Used Car Number List', link: { name:'usednumbers' }},
                { link: {}},
                { title: 'Payments',             link: { name:'payments' }}
            ].map(v => { v.link.params = { series: this.currentSeries }; return v })
        },
        admins() {
            return [
                { title: 'Driver Editor', link: { name:'drivereditor' }},
                { title: 'Host Settings', link: { name:'hostsettings' }},
                { title: 'Server Logs',   link: { name:'serverlogs'   }}
            ]
        }
    },
    watch: {
        /*
        serieslist: function() {
            if (!this.currentSeries && this.$route.name === 'noseries') {
                this.$refs.sselect.activateMenu()
            }
        }
        */
    }
}
</script>

<style lang='scss'>
@import '@/styles/general.scss'
</style>
