<template>
    <div class='inset'>
        <AddExternalResult :seriesevent="seriesevent"></AddExternalResult>

        <div class='theader'>{{seriesevent.name}} External Results</div>
        <v-data-table multi-sort dense :items="tabledata" :headers="headers" :sort-by="['classcode', 'firstname']"
                      :footer-props="{itemsPerPageOptions: [10,20,30,-1]}" :items-per-page.sync="$store.state.itemsPerPage">
            <template v-slot:top>
                <div class='topgrid'>
                    <v-text-field class='right' v-model="search" :append-icon="mdiMagnify" single-line hide-details label="Regex Search"></v-text-field>
                </div>
            </template>

            <template v-slot:[`item.actions`]="{ item }">
                <v-icon @click.stop="deleteResult(item)">{{mdiDelete}}</v-icon>
            </template>
        </v-data-table>

    </div>
</template>


<script>
import AddExternalResult from './AddExternalResult.vue'
import { mapState } from 'vuex'
import { mdiDelete, mdiMagnify } from '@mdi/js'

export default {
    name: 'ExternalResults',
    components: {
        AddExternalResult
    },
    props: {
        seriesevent: Object
    },
    data() {
        return {
            mdiMagnify,
            mdiDelete,
            search: ''
        }
    },
    computed: {
        ...mapState(['drivers', 'externalresults']),
        headers() {
            return [
                { text: 'Class',   value: 'classcode' },
                { text: 'First',   value: 'firstname' },
                { text: 'Last',    value: 'lastname' },
                { text: 'Net',     value: 'net' },
                { text: '',        value: 'actions' }
            ]
        },
        tabledata() {
            if (!this.seriesevent) return []
            if (!this.externalresults[this.seriesevent.eventid]) return []
            return this.externalresults[this.seriesevent.eventid].map(er => {
                const driver = this.drivers[er.driverid]
                if (driver) {
                    er.firstname = driver.firstname
                    er.lastname = driver.lastname
                }
                return er
            }).filter(er => {
                // search bar filter
                if (!this.search) return true
                const reg = this.search.split(' ').map(t => new RegExp(t, 'i'))
                for (const r of reg) {
                    if (r.test(er.firstname) || r.test(er.lastname) || r.test(er.classcode) || r.test(er.net)) return true
                }
                return false
            })
        }
    },
    methods: {
        reset() {
            this.$store.dispatch('getdata', { items: 'externalresults', eventid: this.seriesevent.eventid })
        },
        deleteResult(er) {
            this.$store.dispatch('setdata', {
                type: 'delete',
                items: {
                    externalresults: [{
                        eventid: er.eventid,
                        driverid: er.driverid,
                        classcode: er.classcode
                    }]
                }
            })
        }
    },
    watch: { seriesevent() { this.reset() } },
    mounted() { this.reset() }
}
</script>

<style scoped>
.theader {
    font-size: 120%;
    margin-top: 2rem;
}
</style>
