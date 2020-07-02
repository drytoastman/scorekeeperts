<template>
    <div class='outer'>
        <h2>{{event.name}}</h2>
        <div><router-link :to="{name: 'epayments'}">Payments</router-link></div>
        <div><router-link :to="{name: 'epayments'}">Download Cards</router-link></div>
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
        ...mapState(['events']),
        event() { return this.events[this.eventid] },
        fmtdate() { return format(new Date(this.event.date), 'EEE MMM dd Y') }
    }
}
</script>

<style scoped>
.outer {
    margin: 1rem;
}
</style>
