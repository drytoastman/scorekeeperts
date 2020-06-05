<template>
    <v-app fluid>
        <v-navigation-drawer v-model="drawer" app>
            <v-list dense>
                <v-list-item>
                    <v-list-item-content>
                        <v-list-item-title class="title" style="overflow:visible">Scorekeeper</v-list-item-title>
                        <v-list-item-subtitle>Admin</v-list-item-subtitle>
                    </v-list-item-content>
                </v-list-item>

                <v-divider></v-divider>

                <v-list-item class="fullwidth">
                    <v-list-item-content>
                        <v-select :items="serieslist" v-model="selectedSeries" solo dense hide-details placeholder="Select A Series"></v-select>
                    </v-list-item-content>
                </v-list-item>
            </v-list>
        </v-navigation-drawer>

        <v-app-bar app dense dark color="primary">
            <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
            <v-toolbar-title>{{displayName}}</v-toolbar-title>
            <!-- Events Menu -->
            <v-menu v-model="value" close-on-content-click>
                <template v-slot:activator="{ on }">
                    <v-btn color=white icon v-on="on"><v-icon>{{icons.mdiFlagCheckered}}</v-icon></v-btn>
                </template>
                <v-list>
                    <v-list-item v-for="event in orderedEvents" :key="event.eventid" :to="{name: 'event', params: { eventid: event.eventid }}">
                        <v-list-item-title>{{ event.name }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu>

            <!-- Settings Menu -->
            <v-menu v-model="value2" close-on-content-click>
                <template v-slot:activator="{ on }">
                    <v-btn color=white icon v-on="on"><v-icon>{{icons.mdiCog}}</v-icon></v-btn>
                </template>
                <v-list>
                    <v-list-item v-for="item in items" :key="item.title" :to="item.link">
                        <v-list-item-title>{{ item.title }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu>
        </v-app-bar>

        <v-content>
            <v-progress-circular class="loadingicon" v-if="gettingData" indeterminate color="secondary"></v-progress-circular>
            <div v-if="!$route.name" class="pushdown main-page-warning">Unknown Page</div>
            <router-view v-else-if="haveSeriesAuth" />
            <v-container v-else-if="!haveSeriesAuth">
                <LoginForm ></LoginForm>
            </v-container>
        </v-content>

        <v-snackbar :value="snackbar" :timeout="0">
            <div v-for="error in errors" :key="error">{{ error }}</div>
            <v-btn color="pink" text @click="errorclose">Close</v-btn>
        </v-snackbar>
    </v-app>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { mdiCog, mdiFlagCheckered } from '@mdi/js'
import LoginForm from './components/LoginForm'

export default {
    name: 'Admin',
    components: {
        LoginForm
    },
    props: {
        source: String
    },
    data: () => ({
        drawer: null,
        value: false,
        value2: false,
        icons: {
            mdiCog,
            mdiFlagCheckered
        },
        items: [
            { title: 'Settings', link: { name:'settings' } },
            { title: 'Classes',  link: { name:'classes' }  },
            { title: 'Indexes',  link: { name:'indexes' }  },
            { title: 'Accounts', link: { name:'accounts' }  }
        ]
    }),
    methods: {
        logout: function() {
            this.$store.dispatch('serieslogout', { series: this.currentSeries })
            this.drawer = false
        },
        errorclose: function() {
            this.$store.commit('clearErrors')
        }
    },
    computed: {
        ...mapState(['currentSeries', 'haveSeriesAuth', 'orderedEvents', 'serieslist', 'events', 'errors', 'gettingData']),
        ...mapGetters(['haveSeriesAuth', 'orderedEvents']),
        snackbar() {
            return this.errors.length > 0
        },
        displayName() {
            return `${this.currentSeries} / ${this.$route.name}`
        },
        selectedSeries: {
            get() {
                return this.currentSeries
            },
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
    watch: {}
}
</script>

<style lang='scss'>
.v-navigation-drawer .v-subheader.labelheader {
    font-size: 120%;
}
.loadingicon {
    position: fixed;
    z-index: 200;
    left: 50vw;
    top: 20vh;
}
@import '@/styles/general.scss'
</style>
