<template>
    <div>
        <h2>{{title}}</h2>
        <ClassTable :classcodes="usecodes"></ClassTable>
        Top Times Table Here
    </div>
</template>

<script>
import orderBy from 'lodash/orderBy'
import { mapGetters, mapState } from 'vuex'
import ClassTable from '../components/standard/ClassTable.vue'

export default {
    name: 'Post',
    components: {
        ClassTable
    },
    props: {
        type:    String,
        eventid: String,
        codes:   Array,
        groups:  Array
    },
    computed: {
        ...mapState(['eventresults']),
        ...mapGetters(['classesForGroups']),
        usecodes() {
            return orderBy(this.filteredcodes, v => v)
        },
        filteredcodes() {
            if (this.codes  && this.codes.length)  return this.codes
            if (this.groups && this.groups.length) return this.classesForGroups(this.groups)
            return Object.keys(this.eventresults)
        },
        title() {
            if (this.codes  && this.codes.length)  return `Class ${this.codes.join(', ')}`
            if (this.groups && this.groups.length) return `Group ${this.groups.join(', ')}`
            return 'Event Results'
        }
    }
}
</script>

<style lang="scss" scoped>
h2 {
    color: #556;
    text-align: center;
}
</style>
