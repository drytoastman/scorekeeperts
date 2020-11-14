<template>
    <div>
        Some Header Stuff Here
        <ClassTable></ClassTable>
        Top Times Table Here
    </div>
</template>

<script>
import ClassTable from '../components/standard/ClassTable.vue'

export default {
    name: 'Post',
    components: {
        ClassTable
    }
}
</script>
