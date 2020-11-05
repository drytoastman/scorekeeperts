<template>
    <table class='res'>
        <tbody>
            <tr class='head'>
                <th colspan='5'>{{entrant.firstname}} {{entrant.lastname}} - Course {{entrant.lastcourse}}</th>
            </tr>
            <tr class='subhead'>
                <th width='10%'>#</th>
                <th width='35%'>Raw</th>
                <th width='10%'>C</th>
                <th width='10%'>G</th>
                <th width='35%'>Net</th>
            </tr>

            <tr v-for="r in runs" :key="r.key" :class="rowclass(r)">
                <td>{{run.run}}</td>
                <td>{{run.raw|t3}} {{impval(run.rawimp)}}</td>
                <td>{{run.cones}}</td>
                <td>{{run.gates}}</td>
                <td v-if="r.status !== 'OK'"><span class='status'>{{run.status}}</span></td>
                <td v-else>{{run.net|t3}} {{impval(run.netimp)}}</td>
            </tr>
        </tbody>
    </table>
</template>

<script>

export default {
    name: 'EntrantTable',
    props: {
        entrant: Object
    },
    data() {
        return {
            colspan: 6
        }
    },
    methods: {
        rowclass(r) {
            const c = []
            if (r.norder === 1) c.push('highlight')
            if (r.oldbest)      c.push('improvedon')
            if (r.ispotential)  c.push('couldhave')
            return c.join(' ')
        },
        impval(val) {
            if (val) return `<span class='change'>[${val}|t3}]</span>`
            return ''
        }
    }
}
</script>
