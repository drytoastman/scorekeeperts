<template>
    <v-app fluid>
        <v-app-bar app dense dark color="primary">
            <span class='btitle'>Admin</span>
            <v-select :items="serieslist" v-model="selectedSeries" solo light dense hide-details placeholder="Select A Series" ref="sselect"></v-select>
            <span class='bdesc'>{{$route.meta.marker || $route.name}}</span>
            <v-divider inset vertical></v-divider>

            <AdminMenu :items="eventMenu" :icon="icons.mdiFlagCheckered"    :disabled="!currentSeries"></AdminMenu>
            <AdminMenu :items="settings"  :icon="icons.mdiCog"              :disabled="!currentSeries"></AdminMenu>
            <AdminMenu :items="reports"   :icon="icons.mdiFileTable"        :disabled="!currentSeries"></AdminMenu>
            <AdminMenu :items="admins"    :icon="icons.mdiAccountCowboyHat" :disabled="!currentSeries"></AdminMenu>

            <v-progress-linear :active="!!gettingData" indeterminate absolute bottom color="green accent-4"></v-progress-linear>
        </v-app-bar>

        <v-main>
            <div v-if="!$route.name" class="pushdown main-page-warning">Unknown Page</div>
            <router-view v-else-if="haveSeriesAuth" />
            <v-container v-else-if="!haveSeriesAuth">
                <LoginForm ></LoginForm>
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
        },
        settings: [
            { title: 'Settings', link: { name:'settings' } },
            { title: 'Classes',  link: { name:'classes' } },
            { title: 'Indexes',  link: { name:'indexes' } },
            { title: 'Accounts', link: { name:'accounts' } }
        ],
        reports: [
            { title: 'Series Attendance',    link: { name:'attendseries' } },
            { title: 'Events Attendance',    link: { name:'attendevent' } },
            { title: 'Unique Attendance',    link: { name:'attendunique' } },
            { title: 'Used Car Number List', link: { name:'usednumbers' } },
            {},
            { title: 'Payments',             link: { name:'payments' } }
        ],
        admins: [ /*
            { title: 'Host Settings', link: { name:'hostsettings' } },
            { title: 'Driver Editor', link: { name:'drivereditor' } }
        */]
    }),
    methods: {
        errorclose: function() {
            this.$store.commit('clearErrors')
        }
    },
    computed: {
        ...mapState(['adminAuthenticated', 'currentSeries', 'serieslist', 'events', 'errors', 'gettingData']),
        ...mapGetters(['haveSeriesAuth', 'orderedEvents']),
        snackbar() { return this.errors.length > 0 },
        selectedSeries: {
            get() {
                return this.currentSeries
            },
            set(value) {
                this.$store.commit('changeSeries', value)
                const name = this.$route.name === 'noseries' ? 'summary' : this.$route.name
                this.$router.push({ name: name, params: { series: value } }).catch(error => {
                    // If we change series while on a non-series link, don't throw any errors
                    if (error.name !== 'NavigationDuplicated') {
                        throw error
                    }
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
        }
    },
    watch: {
        serieslist: function() {
            if (!this.currentSeries) {
                this.$refs.sselect.activateMenu()
            }
        }
    }
}
</script>

<style lang='scss'>
html {
    overflow-x: auto;
}

.v-main__wrap, .v-content__wrap {
    max-width: initial;
}

.v-navigation-drawer .v-subheader.labelheader {
    font-size: 120%;
}

.v-toolbar__content {
    .v-text-field {
        max-width: 10rem;
        margin-left: 1rem;
        margin-right: 1rem;
    }
    .btitle {
        font-weight: bold;
        font-size: 130%;
    }
    .bdesc {
        font-weight: bold;
        font-size: 120%;
    }
    .v-divider {
        border-color:#FFFA;
        border-width: 1px;
        margin-left: 1rem;
        margin-right: 0.5rem;
    }
    @media (max-width: 700px) {
        .v-divider, .bdesc {
            display: none;
        }
    }
}

@media print {
    .v-toolbar, .v-snack {
        display: none;
    }
    .v-main {
        padding-top: 0 !important;
    }
}

@import '@/styles/general.scss'
</style>
