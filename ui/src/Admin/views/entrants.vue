<template>
    <div class='outer'>
        <EntrantTable :eventid=eventid></EntrantTable>
    </div>
</template>

<script>
import EntrantTable from '../components/EntrantTable.vue'

export default {
    name: 'EntrantInfo',
    components: {
        EntrantTable
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
