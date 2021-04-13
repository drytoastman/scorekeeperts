<template>
    <div class='contacttable'>
        <h2>Contact List</h2>

        <div class='contactfilters'>
            <div class='header'>Participation Filter</div>

            <v-radio-group hide-details v-model="filtertype" class='filterradio' row>
                <v-radio value="reg"    label="Registered In Any"></v-radio>
                <v-radio value="run"    label="Ran In Any"></v-radio>
                <v-radio value="noshow" label="Registered But Didn't Run In Any"></v-radio>
            </v-radio-group>

            <div class='eventchecks'>
                <v-checkbox hide-details v-for="e in orderedEvents" :key="e.eventid" :label="e.name" v-model="eventfilter[e.eventid]"></v-checkbox>
            </div>

            <div class='header'>Status Filters</div>
            <div class='filterchecks'>
                <v-checkbox label="No Barcode" v-model="nobarcode"></v-checkbox>
            </div>
        </div>

        <div class="exampletext">
            You can unsubscribe from these group messages by going to http://scorekeeper.wwscc.org/register/profile,
            clicking Groups and unselecting <span class='bold'>{{settings.emaillistid}}</span>
        </div>

        <v-data-table multi-sort dense :items="entrantlist" :headers="headers" :sort-by="['lastname']"
                      :footer-props="{itemsPerPageOptions: [10,20,30,-1]}" :items-per-page.sync="$store.state.itemsPerPage">
            <template v-slot:top>
                <div class='topgrid'>
                    <v-menu close-on-content-click>
                        <template v-slot:activator="{on, attrs}">
                            <v-btn v-on="on" v-bind="attrs" color="secondary">Copy Valid Email</v-btn>
                        </template>
                        <v-list>
                            <v-list-item @click="copyemail(',')">Comma separated</v-list-item>
                            <v-list-item @click="copyemail(';')">Semicolon separated</v-list-item>
                        </v-list>
                    </v-menu>

                    <v-btn @click="exportcsv" color="secondary">Export To CSV</v-btn>

                    <v-text-field class='right' v-model="search" :append-icon="mdiMagnify" single-line hide-details label="Regex Search"></v-text-field>
                </div>
            </template>
        </v-data-table>
    </div>
</template>

<script>
import pickBy from 'lodash/pickBy'
import { mapGetters, mapState } from 'vuex'
import { mdiMagnify } from '@mdi/js'
import { sendToClipboard, sendAsDownload } from '@/util/sendtouser'
import isEmail from 'validator/lib/isEmail'

export default {
    name: 'ContactTable',
    data() {
        return {
            mdiMagnify,
            activity: [], // raw data as loaded from server
            search: '',
            filtertype: '',
            eventfilter: {},
            nobarcode: false
        }
    },
    computed: {
        ...mapState(['currentSeries', 'settings']),
        ...mapGetters(['orderedEvents']),
        matchevents() {
            return Object.keys(pickBy(this.eventfilter, v => v))
        },
        validemail() {
            return this.entrantlist.filter(row => {
                return !row.optoutmail && isEmail(row.email)
            }).map(row => {
                return `${row.firstname} ${row.lastname} <${row.email}>`.replaceAll(/[,;]/g, '')
            })
        },
        entrantlist() {
            return this.activity.map(a =>  {
                const classes = new Set()
                for (const l of Object.values(a.runs)) { classes.add(...l) }
                for (const l of Object.values(a.reg))  { classes.add(...l) }
                return Object.assign({ classes: [...classes] }, a)
            }).filter(a => {
                // search bar filter
                if (this.search) {
                    const reg = this.search.split(' ').map(t => new RegExp(t, 'i'))
                    for (const r of reg) {
                        if (!(r.test(a.firstname) || r.test(a.lastname) || r.test(a.email) || r.test(a.barcode) || r.test(a.classes))) return false
                    }
                }
                // barcode status filter
                if (this.nobarcode && a.barcode) {
                    return false
                }
                if (!this.filtertype || !this.matchevents.length) {
                    return true
                }
                // participation filters
                for (const eventid of this.matchevents) {
                    switch (this.filtertype) {
                        case 'run': if (a.runs[eventid]?.length) return true; break
                        case 'reg': if (a.reg[eventid]?.length)  return true; break
                        case 'noshow': if (a.reg[eventid]?.length && !a.runs[eventid]?.length) return true
                    }
                }
                return false
            })
        },
        headers() {
            return [
                { text: 'First',   value: 'firstname' },
                { text: 'Last',    value: 'lastname' },
                { text: 'Email',   value: 'email' },
                { text: 'Barcode', value: 'barcode' },
                { text: 'Classes', value: 'classes' }
            ]
        }
    },
    methods: {
        loadRequired() {
            this.$store.dispatch('getdata', { items: 'activity' }).then(data => {
                this.activity = data.activity
            })
        },
        async copyemail(separator) {
            await sendToClipboard(this.validemail.join(separator))
        },
        exportcsv() {
            sendAsDownload(this.validemail.join(','), 'text/csv', 'email.csv')
        }
    },
    watch: { currentSeries() { this.loadRequired() } },
    async mounted() { this.loadRequired() }
}
</script>

<style scoped lang='scss'>
.contacttable {
    .header {
        margin-top: 1rem;
        font-weight: bold;
        color: #555;
    }

    .filterradio, .eventchecks, .filterchecks {
        margin-top: 4px;
        margin-left: 2rem;
        .v-input {
            margin-top: 0;
        }
        ::v-deep .v-label {
            font-size: 90%;
        }
    }

    .eventchecks {
        border-top: 1px dotted gray;
        padding-top: 4px;
        columns: 15rem auto;
    }

    .exampletext {
        width: 90%;
        margin: 0 auto 1rem auto;
        border:1px solid #CCC;
        border-radius:3px;
        padding:1rem;
        color:#888;
        .bold {
            font-size: 110%;
            font-weight: bold;
            color: black;
        }
    }

    .topgrid {
        display: flex;
        justify-content: center;
        align-items: baseline;
        .v-btn {
            margin-right: 1rem;
        }
        margin-bottom: 1rem;
    }
    .right {
        width: 100%;
    }

    @media (max-width: 700px) {
        .topgrid {
            display: initial;
        }
        .right {
            padding-top: 0;
            margin-bottom: 1rem;
        }
    }
}
</style>
