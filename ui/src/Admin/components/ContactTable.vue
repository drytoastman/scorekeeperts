<template>
    <div class='contacttable'>
        <v-data-table :items="entrantlist" :headers="headers" :search="search"
                        :footer-props="{itemsPerPageOptions: [10,20,30,-1]}" :items-per-page.sync="$store.state.itemsPerPage"
                        :sort-by="['lastname']" multi-sort dense>
            <template v-slot:top>
                <div class='topgrid'>
                <div class='title'>Contact List</div>
                <v-text-field class='right' v-model="search" :append-icon="icons.mdiMagnify" single-line hide-details label="Search">
                </v-text-field>
                </div>
            </template>
         </v-data-table>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import { mdiMagnify } from '@mdi/js'

export default {
    name: 'ContactTable',
    data() {
        return {
            icons: {
                mdiMagnify
            },
            search: '',
            activity: []
        }
    },
    computed: {
        ...mapState(['currentSeries', 'drivers', 'cars', 'events', 'registered', 'runs']),
        entrantlist() {
            return this.activity.map(a =>  {
                const classes = new Set()
                for (const l of Object.values(a.runs)) { classes.add(...l) }
                for (const l of Object.values(a.reg)) { classes.add(...l) }
                return Object.assign({ classes: [...classes] }, a)
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
        }
    },
    watch: { currentSeries() { this.loadRequired() } },
    async mounted() { this.loadRequired() }
}
</script>

<style lang='scss'>
.contacttable {
    margin: 1rem;
    .v-btn {
        margin-right: 1rem;
    }
    .busy {
        color: #F44;
    }
    .v-text-field {
        padding-top: 0;
    }

    .v-data-table td, .v-data-table th {
        padding: 0 4px;
    }
    .v-data-table__wrapper {
        overflow-x: hidden;
    }
    .topgrid {
        display: grid;
        grid-template-columns: 2fr 3fr;
        align-items: baseline;
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
