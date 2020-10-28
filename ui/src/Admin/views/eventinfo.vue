<template>
    <div class='' v-if="event">
        <div class='header inset'>
            <span class='name'>{{event.name}}</span>
            <span class='date'>{{fmtdate}}</span>
            <v-select :items="downloads" hide-details solo placeholder="Get Cards" v-model="cardtype" @change="carddownload">
                <template v-slot:selection="d">
                    <span v-if="d.item.text">{{d.item.text}}</span>
                    <span v-else-if="downloading" class='nonitem'>Generating ...</span>
                    <span v-else class='nonitem'>Get Cards</span>
                </template>
            </v-select>
            <v-btn icon @click="confirmDelete=true"><v-icon>{{icons.mdiDelete}}</v-icon></v-btn>
            <span></span>
        </div>
        <ConfirmDialog v-model=confirmDelete title="Confirm Event Deletion" @ok='deleteEvent'>
            Are you sure you wish to delete {{event.name}} and its registered entries?
            Events with runs or payments cannot be deleted directly.
        </ConfirmDialog>
        <v-tabs color="secondary" show-arrows>
            <v-tab>Event Settings</v-tab>
            <v-tab>Payment Setup</v-tab>
            <v-tab>Entry Admin</v-tab>
            <v-tab v-if="event.ispro">Grid Order</v-tab>

            <v-tab-item>
                <EventSettings :seriesevent="event"></EventSettings>
            </v-tab-item>
            <v-tab-item>
                <PaymentSettings :seriesevent="event"></PaymentSettings>
            </v-tab-item>
            <v-tab-item>
                <EntrantTable :eventid=eventid></EntrantTable>
            </v-tab-item>
            <v-tab-item  v-if="event.ispro">
                <GridOrder :eventid=eventid></GridOrder>
            </v-tab-item>

        </v-tabs>
    </div>
</template>

<script>
import Vue from 'vue'
import { mdiDelete } from '@mdi/js'
import { format } from 'date-fns'
import { mapState } from 'vuex'
import EventSettings from '../components/event/EventSettings.vue'
import EntrantTable from '../components/EntrantTable.vue'
import GridOrder from '../components/event/GridOrder.vue'
import PaymentSettings from '../components/event/PaymentSettings.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

export default {
    name: 'EventInfo',
    components: {
        EventSettings,
        EntrantTable,
        GridOrder,
        PaymentSettings,
        ConfirmDialog
    },
    props: {
        eventid: String
    },
    data()  {
        return {
            cardtype: null,
            downloading: false,
            confirmDelete: false,
            icons: {
                mdiDelete
            },
            downloads: [
                { value: null,       text: '' },
                { value: 'lastname', text: 'PDF by lastname' },
                { value: 'blank',    text: 'PDF blank' },
                { value: 'csv',      text: 'csv' }
            ]
        }
    },
    computed: {
        ...mapState(['events', 'drivers', 'cars', 'registered']),
        event() { return this.events[this.eventid] },
        fmtdate() { return format(new Date(this.event.date), 'EEE MMM dd Y') }
    },
    methods: {
        async carddownload() {
            let order = 'lastname'
            let type = 'pdf'
            switch (this.cardtype) {
                case 'blank':  order = 'blank'; break
                case 'csv':    type  = 'csv';   break
            }

            this.downloading = true
            Vue.nextTick(() => { this.cardtype = null })

            this.$store.dispatch('carddownload', {
                eventid:  this.eventid,
                cardtype: type,
                order:    order
            }).then(data => { if (data) this.downloading = false })
        },
        deleteEvent() {
            this.$store.dispatch('setdata', {
                type: 'delete',
                items: { events: [this.event] }
            }).then(data => {
                if (data) this.$router.push({ name: 'summary' })
            })
        }
    }
}
</script>

<style scoped lang='scss'>
.header {
    display: grid;
    grid-template-columns: auto auto auto auto 1fr;
    column-gap: 2rem;
    align-items: center;
    padding-bottom: 0.5rem;
    .name {
        font-size: 140%;
        font-weight: bold;
        color: #444;
    }
    .date {
        font-size: 110%;
    }
    .v-select {
        padding: 0;
        margin: 0;
    }
    .nonitem {
        color: #8A8C;
    }
}
::v-deep .v-tabs-bar {
    border-top: 1px solid #0004;
    border-bottom: 1px dotted #0008;
}
</style>
