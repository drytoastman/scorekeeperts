<template>
    <table class='live'>
        <tbody>
            <tr class='head'><th colspan='6'>Top Times ({{this.type}})</th></tr>
            <tr class='subhead'><th>#</th><th>Name</th><th>Class</th><th colspan=1>Index</th><th>Time</th></tr>

            <tr v-for="e in rows" :key="e.carid" :class="rowclass(e)">
                <td>{{e.pos}}</td>
                <td class='name limit'>{{e.name}}</td>
                <td>{{e.classcode}}</td>
                <!--<td>{{e.indexstr}}</td>-->
                <td>{{e.indexval|t3}}</td>
                <td>{{e.time|t3}}</td>
            </tr>
        </tbody>
    </table>
</template>

<script>
import { rowclass } from '../util'

export default {
    name: 'TopTimesTable',
    props: {
        tttable: Object,
        type: String
    },
    computed: {
        rows() {
            if (this.tttable && this.tttable.rows) {
                return this.tttable.rows.map(a => a[0])
            }
            return []
        }
    },
    data() {
        return {
            rowclass
        }
    }
}
</script>

<style lang="scss" scoped>
td {
    max-width: 9rem; // for the overflow to work
}
</style>
