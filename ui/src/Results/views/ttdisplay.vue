<template>
    <div>
        <TopTimesTable v-if="seriesinfo.events" :table="tttable"></TopTimesTable>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import TopTimesTable from '../components/standard/TopTimesTable.vue'
import { createTopTimesTable } from '@/common/toptimes'
import { ClassData } from '@/common/classindex'

export default {
    name: 'TTDisplay',
    components: {
        TopTimesTable
    },
    props: {
        counted: String
    },
    computed: {
        ...mapState(['seriesinfo', 'eventresults']),
        classdata() {
            return new ClassData(this.seriesinfo.classes, this.seriesinfo.indexes)
        },
        tttable() {
            if (!this.seriesinfo.events) return []
            const keys = []
            keys.push({ indexed: 1, counted: parseInt(this.counted) })
            keys.push({ indexed: 0, counted: parseInt(this.counted) })
            return createTopTimesTable(this.classdata, this.eventresults, keys)
        }
    }
}
</script>

<style lang="scss" scoped>
</style>
