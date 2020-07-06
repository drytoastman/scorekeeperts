<template>
    <div class='outer'>
        <h2>{{event.name}} {{fmtdate}}</h2>
        <div><router-link :to="{name: 'epayments'}">Payments</router-link></div>
        <v-btn @click='dopdf'>Generate Cards</v-btn>
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
    computed: {
        ...mapState(['events', 'drivers', 'cars', 'registered']),
        event() { return this.events[this.eventid] },
        fmtdate() { return format(new Date(this.event.date), 'EEE MMM dd Y') }
    },
    methods: {
        async dopdf() {
            return 0
        }
    }
}
</script>

<style scoped>
.outer {
    margin: 1rem;
}
</style>
