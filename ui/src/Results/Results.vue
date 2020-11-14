<template>
    <v-app fluid>
        <v-app-bar dark color="primary">
            <v-img :src=cone max-height=40 max-width=40></v-img>
            <div class='header'>Scorekeeper Results</div>
            <div class='menus'>
                <ResultsMenu v-model="selectedYear"    depend="ok"             :items="yearlist"   placeholder="Select Year"></ResultsMenu>
                <ResultsMenu v-model="selectedSeries" :depend="selectedYear"   :items="serieslist" placeholder="Select Series"></ResultsMenu>
                <ResultsMenu v-model="selectedEvent"  :depend="selectedSeries" :items="eventlist"  placeholder="Select Event"></ResultsMenu>
            </div>
        </v-app-bar>

        <v-main>
             <!-- {{$route.name}} {{$route.params}} -->
            <router-view/>
        </v-main>
        <SnackBar></SnackBar>
    </v-app>
</template>


<script>
import orderBy from 'lodash/orderBy'
import { mapGetters, mapState } from 'vuex'

import SnackBar from '@/components/SnackBar.vue'
import ResultsMenu from './components/ResultsMenu.vue'
import cone from '@/../public/images/cone.png'
import { seriesYear } from '@/store/results'

export default {
    name: 'Results',
    components: {
        SnackBar,
        ResultsMenu
    },
    data() {
        return  {
            cone,
            year: undefined,
            event: undefined
        }
    },
    computed: {
        ...mapState(['currentSeries', 'seriesinfo']),
        ...mapGetters(['yearGroups']),

        yearlist()   { return orderBy([...this.yearGroups.keys()], v => v, 'desc') },
        serieslist() { return orderBy(this.yearGroups.getD(this.year), v => v) },
        eventlist()  { return this.seriesinfo.events ? orderBy(this.seriesinfo.events, 'date') : [] },

        selectedYear: {
            get() { return this.year },
            set(value) {
                this.year = value
                this.$store.commit('changeSeries', '')
                this.push(name, {})
            }
        },

        selectedSeries: {
            get() { return this.currentSeries },
            set(value) {
                this.$store.commit('changeSeries', value)
                this.selectedEvent = undefined
                if (value) {
                    this.push('series', { series: value })
                }
            }
        },

        selectedEvent: {
            get() { return this.event },
            set(value) {
                this.event = value
                if (this.event) {
                    this.updateResults()
                    this.push('eventindex', { eventid: this.event.eventid })
                }
            }
        }
    },
    methods: {
        push(name, params) {
            this.$router.push({ name: name, params: params }).catch(error => {
                if (error.name !== 'NavigationDuplicated') { throw error }
            })
        },
        updateResults() {
            this.$store.dispatch('getdata', { items: 'eventresults', eventid: this.event.eventid }).then(data => {
                console.log('commit')
                if (data) this.$store.commit('apiData', { eventresultsid: this.event.eventid })
            })
        }
    },
    watch: {
        // Need to wait for certain things before we can initialize year and event from route info
        '$route'() {
            if (this.$route.params.series) {
                this.year = seriesYear(this.$route.params.series)
            }
        },
        eventlist(nv) {
            if (nv.length && !this.event && this.$route.params.eventid) {
                const f = nv.filter(e => e.eventid === this.$route.params.eventid)
                if (f.length) {
                    this.event = f[0]
                    this.updateResults()
                }
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.header {
    margin-left: 1rem;
    margin-right: 1rem;
}

.menus {
    display: flex;
    column-gap: 5px;
}

.v-sheet.v-app-bar {
    height: initial !important;
    flex-grow: 0;
}

::v-deep .v-toolbar__content {
    flex-wrap: wrap;
    height: initial !important;
}

</style>

<style lang="scss">
@import '@/styles/general.scss';
@import '@/styles/results.scss';
</style>
