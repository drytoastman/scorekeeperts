<template>
    <v-app fluid>
        <v-app-bar app dense dark color="primary">
            <!-- <v-app-bar-nav-icon @click.stop="drawer = !drawer" /> -->
            <span class='btitle'>Admin</span>
            <v-select :items="serieslist" v-model="selectedSeries" solo light dense hide-details placeholder="Select A Series" ref="sselect"></v-select>
            <span class='bdesc'>{{$route.name}}</span>
            <v-divider inset vertical></v-divider>

            <!-- Events Menu -->
            <v-menu close-on-content-click :disabled="!currentSeries">
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
            <v-menu close-on-content-click :disabled="!currentSeries">
                <template v-slot:activator="{ on }">
                    <v-btn color=white icon v-on="on"><v-icon>{{icons.mdiCog}}</v-icon></v-btn>
                </template>
                <v-list v-if="currentSeries">
                    <v-list-item v-for="item in settings" :key="item.title" :to="item.link">
                        <v-list-item-title>{{ item.title }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu>

            <!-- Admin Menu --
            <v-menu close-on-content-click>
                <template v-slot:activator="{ on }">
                    <v-btn color=white icon v-on="on"><v-icon>{{icons.mdiAccountCowboyHat}}</v-icon></v-btn>
                </template>
                <v-list>
                    <v-list-item v-for="item in adminitems" :key="item.title" :to="item.link">
                        <v-list-item-title>{{ item.title }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu>
            -->

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
import { mdiCog, mdiFlagCheckered, mdiAccountHardHat, mdiAccountCowboyHat } from '@mdi/js'
import LoginForm from './components/LoginForm'

export default {
    name: 'Admin',
    components: {
        LoginForm
    },
    data: () => ({
        icons: {
            mdiCog,
            mdiFlagCheckered,
            mdiAccountHardHat,
            mdiAccountCowboyHat
        },
        settings: [
            { title: 'Settings', link: { name:'settings' } },
            { title: 'Classes',  link: { name:'classes' }  },
            { title: 'Indexes',  link: { name:'indexes' }  },
            { title: 'Accounts', link: { name:'accounts' }  }
        ],
        adminitems: [ /*
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
@import '@/styles/general.scss'
</style>
