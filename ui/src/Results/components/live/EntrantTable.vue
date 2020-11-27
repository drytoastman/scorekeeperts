<template>
    <table class='live' v-if="entrant">
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

            <tr v-for="r in runs" :key="r.run" :class="rowclass(r)">
                <td>{{r.run}}</td>
                <td>{{r.raw|t3}} <span class='change' v-html="impval(r.rawimp)"></span></td>
                <td>{{r.cones}}</td>
                <td>{{r.gates}}</td>
                <td v-if="r.status !== 'OK'"><span class='status'>{{r.status}}</span></td>
                <td v-else>{{r.net|t3}} <span class='change' v-html="impval(r.netimp)"></span></td>
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
    computed: {
        runs() {
            return this.entrant.runs ? this.entrant.runs[0] : []
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
            if (val) {
                let s = val.toFixed(3)
                if (val > 0) { s = '+' + s }
                return `[${s}]`
            }
            return ''
        }
    }
}
</script>
