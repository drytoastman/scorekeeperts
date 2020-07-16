<template>
    <div class='outer'>
        <PaymentTable :eventid=eventid></PaymentTable>
    </div>
</template>

<script>
import PaymentTable from '../components/PaymentTable.vue'

export default {
    name: 'EventInfo',
    components: {
        PaymentTable
    },
    props: {
        eventid: String
    }
}
</script>

<style scoped>
.outer {
    margin: 1rem;
}
</style>
