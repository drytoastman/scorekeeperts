<template>
    <table class='results toptimes'>
        <!-- Section Titles -->
        <tr class='head'>
            <th v-for="(title, idx) in table.titles" :key="title" :colspan="table.colcount[idx]">{{title}}</th>
        </tr>

        <!-- Column headers -->
        <tr class='subhead'>
            <template v-for="(colgroups,idx1) in table.cols">
                <th v-for="(col, idx2) of colgroups" :key="`${idx1}+${idx2}`">{{col}}</th>
            </template>
        </tr>

        <!-- Data rows -->
        <tr v-for="(fullrow, idx) in table.rows" :key="idx">
            <template v-for="(obj, idx1) in fullrow">
                <td :class="key" v-for="(key, idx2) in table.fields[idx1]" :key="`${obj.time}+${idx2}`">
                    {{format(obj, key)}}
                </td>
            </template>
        </tr>
    </table>
</template>

<script>
import { t3 } from '@/util/filters'

export default {
    name: 'TopTimesTable',
    props: {
        table: Object
    },
    methods: {
        format(obj, key) {
            switch (key) {
                case 'time':
                case 'indexval':
                    return t3(obj[key])
                default:
                    return obj[key]
            }
        }
    }
}
</script>

<style lang="scss" scoped>
</style>
