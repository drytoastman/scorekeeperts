<template>
    <div class='outer'>
        <EntrantTable :type=type></EntrantTable>
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
        type: String
    }
}
</script>

<style scoped>
.outer {
    margin: 1rem;
}
</style>
