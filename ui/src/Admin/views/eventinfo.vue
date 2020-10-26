<template>
    <div class='outer' v-if="event">
        <h2>{{event.name}} {{fmtdate}}</h2>
        <v-tabs color="secondary" show-arrows>
            <v-tab>Cards</v-tab>
            <v-tab>Event Settings</v-tab>
            <v-tab>Payment Setup</v-tab>
            <v-tab>Entry Admin</v-tab>
            <v-tab v-if="event.ispro">Grid Order</v-tab>

            <v-tab-item>
                <div class='adminbuttons'>
                    <v-btn @click='carddownload' color='secondary'>Generate Cards</v-btn>
                </div>
                <div class='cardswrap'>

                    <v-select v-model="cardtype" label="Download Type" :items="['pdf', 'template', 'csv']"></v-select>
                    <v-select v-model="order" label="Order" :items="['lastname', 'classnumber', 'blank']"></v-select>
                </div>
            </v-tab-item>
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
import { format } from 'date-fns'
import { mapState } from 'vuex'
import EventSettings from '../components/event/EventSettings.vue'
import EntrantTable from '../components/EntrantTable.vue'
import GridOrder from '../components/event/GridOrder.vue'
import PaymentSettings from '../components/event/PaymentSettings.vue'

export default {
    name: 'EventInfo',
    components: {
        EventSettings,
        EntrantTable,
        GridOrder,
        PaymentSettings
    },
    props: {
        eventid: String
    },
    data()  {
        return {
            cardtype: 'pdf',
            order: 'lastname'
        }
    },
    computed: {
        ...mapState(['events', 'drivers', 'cars', 'registered']),
        event() { return this.events[this.eventid] },
        fmtdate() { return format(new Date(this.event.date), 'EEE MMM dd Y') }
    },
    methods: {
        async carddownload() {
            this.$store.dispatch('carddownload', {
                eventid: this.eventid,
                cardtype: this.cardtype,
                order: this.order
            })
        }
    }
}
</script>

<style scoped>
.outer {
    margin: 0.5rem;
}
.cardswrap {
    margin: 1rem 0;
    max-width: 40rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 1rem;
}
</style>
