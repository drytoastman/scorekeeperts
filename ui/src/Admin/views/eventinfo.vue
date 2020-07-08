<template>
    <div class='outer'>
        <h2>{{event.name}} {{fmtdate}}</h2>
        <div><router-link :to="{name: 'epayments'}">Payments</router-link></div>
        <div class='cardswrap'>
            <v-select v-model="cardtype" label="Download Type" :items="['pdf', 'template', 'csv']"></v-select>
            <v-select v-model="order" label="Order" :items="['lastname', 'classnumber']"></v-select>
            <v-btn @click='carddownload' color='secondary' style='grid-column: 1/span 2'>Generate Cards</v-btn>
        </div>

        <EventSettings :event="event"></EventSettings>
    </div>
</template>

<script>
import { format } from 'date-fns'
import { mapState } from 'vuex'
import EventSettings from '../components/EventSettings.vue'

export default {
    name: 'EventInfo',
    components: {
        EventSettings
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
    margin: 1rem;
}
.cardswrap {
    border: 1px solid #ccc;
    border-radius: 3px;
    max-width: 30rem;
    padding: 1rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 1rem;
}
</style>
