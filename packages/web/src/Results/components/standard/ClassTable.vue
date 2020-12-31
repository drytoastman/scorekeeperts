<template>
    <div>
        <div class='classlinks' v-if="classcodes.length > 1">
            <a v-for="code in classcodes" :key="code" :href='`#body${code}`'>{{code.replace("_","")}}</a>
        </div>
        <table class='results'>
        <tbody v-for="(entrants, code) in results" :key="code" :id='`body${code}`'>
            <tr class='head'>
                <th :colspan='colspan'>{{code}} - {{descrip(code)}}</th>
            </tr>
            <tr class='subhead'>
                <th class='pos'></th>
                <th class='trophy'></th>
                <th class='entrant'>Entrant</th>
                <th v-for="ii in runs" :key="ii" class='run'>Run {{ii+1}}</th>
                <th v-if="event.courses > 1" class='total'>Total</th>
                <th class='points'>Points</th>
            </tr>

            <template v-for="e of entrants">
                <tr :key="e.carid" class='mainentrantrow'>
                    <td class='pos'     :rowspan="rowspan">{{e.position}}</td>
                    <td class='trophy'  :rowspan="rowspan">{{e.trophy ? 'T' : ''}}</td>
                    <td class='entrant' :rowspan="rowspan">
                        <div class='block'>
                            <span class='num'>#{{e.number}}</span>
                            <span v-if="e.indexstr" class='idx'>({{e.indexstr}})</span>
                            <span class='name'>{{e.firstname}} {{e.lastname}}</span>
                            <span class='desc'>{{e.year}} {{e.make}} {{e.model}} {{e.color}}</span>
                        </div>
                    </td>
                    <template v-for="(run, ii) in e.runs ? e.runs[0] : []">
                        <td :key="ii" v-if="!run" class='run'>no data</td>
                        <td :key="ii" v-else :class="runclasses(run)" v-html="rundata(run, e.indexstr.length)"></td>
                    </template>
                    <td class='total'   :rowspan="rowspan" v-if="event.courses > 1">{{e.net | t3}}</td>
                    <td class='points'  :rowspan="rowspan">{{e.points | t3}}</td>
                </tr>
                <tr v-for="c in pluscourses" :key="e.carid + c" class='subentrantrow'>
                    <template v-for="(run, ii) in e.runs ? e.runs[c] : []">
                        <td :key="ii" v-if="!run" class='run'>no data</td>
                        <td :key="ii" v-else :class="runclasses(run)" v-html="rundata(run, e.indexstr.length)"></td>
                    </template>
                </tr>
            </template>
            <tr class='endofclass'></tr>
        </tbody>
        </table>
    </div>
</template>

<script>
import pick from 'lodash/pick'
import range from 'lodash/range'
import { mapGetters, mapState } from 'vuex'
import { t3 } from '@/util/filters'

export default {
    name: 'ClassTable',
    props: {
        classcodes: Array
    },
    computed: {
        ...mapState(['eventresults', 'seriesinfo']),
        ...mapGetters(['resultsEvent']),

        rowspan() { return this.event.courses > 1 ? this.event.courses : undefined },
        colspan() { return this.event.runs + (this.event.courses > 1 ? 5 : 4) },
        pluscourses() { return range(1, this.event.courses) },
        runs() { return range(this.event.runs) },
        event() { return this.resultsEvent },
        results()  { return pick(this.eventresults, this.classcodes) },
        classmap() {
            const ret = {}
            for (const cls of this.seriesinfo.classes) ret[cls.classcode] = cls
            return ret
        }
    },
    methods: {
        runclasses(run) {
            const classes = ['run']
            if (run.norder === 1) classes.push('bestnet')
            if (run.rorder === 1) classes.push('bestraw')
            return classes.join(' ')
        },
        rundata(run, showraw) {
            const data = []
            if (run.status === 'OK') {
                data.push(`<span class='net'>${t3(run.net)} (${run.cones},${run.gates})</span>`)

            } else if (run.status !== 'PLC') {
                data.push(`<span class='net'>${run.status}</span>`)
            }
            if (showraw && run.raw < 999.999) {
                data.push(`<span class='raw'>[${t3(run.raw)}]</span>`)
            }
            if (this.event.ispro) {
                const rea = run.reaction
                const six = run.sixty
                if (rea || six) {
                    data.push(`<span class='reaction'>${t3(rea)}/${t3(six)}</span>`)
                } else {
                    data.push("<span class='reaction'>&zwnj;</span>")
                }
            }
            return data.join('')
        },
        descrip(classcode) {
            return this.classmap[classcode].descrip
        }
    }
}
</script>

<style lang="scss" scoped>
.classlinks {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    column-gap: 10px;
    a {
        text-decoration: none;
    }
}
@media print {
    .classlinks {
        display: none;
    }
}
</style>
