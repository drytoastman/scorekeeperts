<template>
    <div class='outer'>
        <div>{{event.name}}</div>
        <div>{{event.date}}</div>
        <router-link :to="{name: 'epayments'}">Link</router-link>
    </div>
</template>

<script>
import { mapState } from 'vuex'
export default {
    name: 'EventInfo',
    props: {
        eventid: String
    },
    computed: {
        ...mapState(['events']),
        event() { return this.events[this.eventid] }
    }
}
</script>

<style scoped>
.outer {
    margin: 1rem;
}
</style>
