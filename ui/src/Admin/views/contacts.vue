<template>
    <div class='inset'>
        <ContactTable :type=type></ContactTable>
    </div>
</template>

<script>
import ContactTable from '../components/ContactTable.vue'

export default {
    name: 'EntrantInfo',
    components: {
        ContactTable
    },
    props: {
        type: String
    }
}
</script>

<style scoped>
</style>
