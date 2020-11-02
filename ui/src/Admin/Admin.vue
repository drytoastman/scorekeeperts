<template>
    <v-app fluid>
        <v-app-bar app height=45 extension-height=35 dark color="primary">
            <SeriesBar title="Admin"></SeriesBar>
            <template v-slot:extension>
                <AdminMenu :items="eventMenu" text="events"  :disabled="!currentSeries"></AdminMenu>
                <AdminMenu :items="settings"  text="series"  :disabled="!currentSeries"></AdminMenu>
                <AdminMenu :items="reports"   text="reports" :disabled="!currentSeries"></AdminMenu>
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

        <SnackBar></SnackBar>
    </v-app>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { mdiCog, mdiFlagCheckered, mdiAccountHardHat, mdiAccountCowboyHat, mdiFileTable } from '@mdi/js'
import LoginForm from './components/LoginForm.vue'
import AdminMenu from './components/AdminMenu.vue'
import SnackBar from '@/components/SnackBar.vue'
import SeriesBar from '@/components/SeriesBar.vue'

export default {
    name: 'Admin',
    components: {
        LoginForm,
        AdminMenu,
        SnackBar,
        SeriesBar
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
        logout: function() {
            this.$store.dispatch('logout')
        }
    },
    computed: {
        ...mapState(['auth', 'currentSeries', 'events', 'gettingData']),
        ...mapGetters(['haveAuth', 'orderedEvents']),
        eventMenu() {
            return this.orderedEvents.map(e => ({
                title: e.name,
                key: e.eventid,
                link: {
                    name: 'event',
                    params: { eventid: e.eventid }
                }
            }))
        },
        haveAuth() {
            // const r = this.$router.matcher.match(this.$route.name)
            if (this.$route.meta.adminauth) {
                return this.auth.admin
            }
            return this.auth.series[this.currentSeries] || this.auth.admin
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
                { title: 'Event Payments',       link: { name:'payments' }},
                { title: 'Membership',           link: { name:'membership' }},
                { title: 'Contact List',         link: { name:'contacts' }}  // TODO
            ].map(v => { v.link.params = { series: this.currentSeries }; return v })
        },
        admins() {
            return [
                { title: 'New Events',        link: { name:'newevents' }},
                { title: 'Driver/Car Editor', link: { name:'drivereditor' }},
                { title: 'Purge Tool',        link: { name:'purge' }},
                { link: {}},
                { title: 'New Series',     link: { name:'newseries' }},
                { title: 'Archive Series', link: { name:'archive' }},
                { title: 'Host Settings',  link: { name:'hostsettings' }},
                { title: 'Server Logs',    link: { name:'serverlogs'   }}
            ]
        }
    }
}
</script>

<style lang='scss'>
.baseadminbuttons {
    display: grid;
    column-gap: 1rem;
    margin: 1rem 0;
    width: 100%;
    @media (max-width: 800px) {
        margin: 1rem;
    }
}

.adminbuttons {
    @extend .baseadminbuttons;
    grid-template-columns: 10rem 10rem;
}

.adminbuttons1 {
    @extend .baseadminbuttons;
    grid-template-columns: 10rem;
}

.adminbuttons3 {
    @extend .baseadminbuttons;
    grid-template-columns: 10rem 10rem 10rem;
}

.actionbuttons {
    display: grid;
    grid-template-columns: 15px 15px;
    column-gap: 0.5rem;
}

.prism-editor-wrapper {
    border: 1px solid lightgray !important;
    border-radius: 4px;
    border-left: 4px solid rgb(116, 160, 149) !important;
    padding: 0.3rem 0.5rem !important;
}

@import '@/styles/general.scss'
</style>
