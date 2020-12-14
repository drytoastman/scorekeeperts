<template>
    <div>
        <ClassTable :classcodes="classcodes"></ClassTable>
    </div>
</template>

<script>
import ClassTable from '../components/standard/ClassTable.vue'

export default {
    name: 'ByClass',
    components: {
        ClassTable
    },
    props: {
        query: Object
    },
    computed: {
        classcodes() { return this.query ? this.query.list.split(',') : [] }
    }
}
</script>
