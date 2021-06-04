<template>
    <table class='auditreport'>
        <thead>
            <tr class='subhead'>
                <th>First</th>
                <th>Last</th>
                <th>#</th>
                <th v-if="!event.usingSessions">Cls</th>
                <th v-for="ii in runs" :key="ii" class='run'>Run {{ii+1}}</th>
            </tr>
        </thead>

        <tbody>
            <tr v-for="entrant of audit" :key="entrant.carid">
                <td :class='order == "firstname" ? "bold" : ""'>{{limit(entrant.firstname)}}</td>
                <td :class='order == "lastname" ? "bold" : ""'>{{limit(entrant.lastname)}}</td>
                <td>{{entrant.number}}</td>
                <td v-if="!event.usingSessions">{{entrant.classcode}} ({{entrant.indexcode}})</td>

                <td v-for="run of entrant.runs[course-1]" :key="run.number">
                    <span v-if="run">
                        <span v-if="run.status == 'PLC'">
                        </span>
                        <span v-else-if="run.status != 'OK'">
                            {{run.status}}
                        </span>
                        <span v-else>
                            {{run.raw | t3}}
                            ({{run.cones}}, {{run.gates}})
                        </span>
                    </span>
                </td>
            </tr>
        </tbody>
    </table>
</template>

<script>
import range from 'lodash/range'
import { mapGetters, mapState } from 'vuex'

export default {
    name: 'AuditTable',
    props: {
        audit: Array,
        course: Number,
        order: String
    },
    computed: {
        ...mapState(['eventresults', 'seriesinfo']),
        ...mapGetters(['resultsEvent']),
        runs() { return range(this.event.runs) },
        event() { return this.resultsEvent }
    },
    methods: {
        limit(str) {
            if (str) return str.substring(0, 10)
            return str
        }
    }
}
</script>

<style lang="scss" scoped>
.auditreport {
    border: 1px solid grey;
    border-collapse: collapse;
    tr:nth-child(even) {
        background: lightgray;
    }
    td {
        border: 1px solid grey;
        padding: 2px 5px;
    }
    .bold {
        font-weight: bold;
    }
}
@media print {
    .classlinks {
        display: none;
    }
}
</style>
