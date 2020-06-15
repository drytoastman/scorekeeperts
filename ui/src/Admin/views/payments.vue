<template>
    <div class='outer'>
        <PaymentTable :eventid=eventid></PaymentTable>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import PaymentTable from '../components/PaymentTable.vue'

export default {
    name: 'EventInfo',
    components: {
        PaymentTable
    },
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
