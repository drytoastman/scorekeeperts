<template>
    <div>
        <h2>{{title}}</h2>
        <ClassTable :classcodes="usecodes"></ClassTable>
        <TopTimesTable v-if="seriesinfo.events" :table="tttable"></TopTimesTable>
    </div>
</template>

<script>
import orderBy from 'lodash/orderBy'
import { mapGetters, mapState } from 'vuex'

import ClassTable from '../components/standard/ClassTable.vue'
import TopTimesTable from '../components/standard/TopTimesTable.vue'
import { createTopTimesTable } from '@/common/toptimes'
import { ClassData } from '@/common/classindex'

export default {
    name: 'ResultsDisplay',
    components: {
        ClassTable,
        TopTimesTable
    },
    props: {
        codes:   Array,
        groups:  Array
    },
    computed: {
        ...mapState(['seriesinfo', 'eventresults']),
        ...mapGetters(['classesForGroups', 'resultsClasses']),
        type() {
            if (this.codes  && this.codes.length)  return 'bycode'
            if (this.groups && this.groups.length) return 'bygroup'
            return 'event'
        },
        classdata() {
            return new ClassData(this.seriesinfo.classes, this.seriesinfo.indexes)
        },
        usecodes() {
            return orderBy(this.filteredcodes, v => v)
        },
        filteredcodes() {
            switch (this.type) {
                case 'bycode':  return this.codes
                case 'bygroup': return this.classesForGroups(this.groups)
                case 'event':   return this.resultsClasses
            }
            return []
        },
        title() {
            switch (this.type) {
                case 'bycode':  return `Class ${this.codes.join(', ')}`
                case 'bygroup': return `Group ${this.groups.join(', ')}`
                case 'event':   return 'Event Results'
            }
            return ''
        },
        tttable() {
            if (this.type !== 'event') return {}
            const keys = []
            keys.push({ indexed: 1, counted: 1 })
            keys.push({ indexed: 0, counted: 1 })
            return createTopTimesTable(this.classdata, this.eventresults, keys)
        }
    }
}
</script>

<style lang="scss" scoped>
</style>
