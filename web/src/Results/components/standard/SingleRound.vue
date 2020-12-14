<template>
    <table class='challengeround results'>
        <tr class='head'>
            <th class='entrant'>Entrant</th>
            <th class='dial'>Dial</th>
            <th></th>
            <th>Reac</th>
            <th>Sixty</th>
            <th>Time</th>
            <th>Diff</th>
            <th>Total</th>
        </tr>

        <template v-for="({e, css}, idx) of sides">
            <tr :key="idx" :class="css">
                <td rowspan=2>
                    <div class='entrantwrap' v-if="e">
                        <span class='name'>{{e.firstname}} {{e.lastname}}</span>
                        <span class='class'>{{e.classcode}}</span>
                        <span class='index' v-if="e.indexcode">({{e.indexcode}})</span>
                    </div>
                </td>
                <td rowspan=2 class='dial'>
                    <span v-if="e.dial < 999">{{e.dial|t3}}</span>
                </td>

                <template v-if="e.left">
                    <td>L</td>
                    <td>{{e.left.reaction|t3}}</td>
                    <td>{{e.left.sixty|t3}}</td>
                    <td>{{e.left.raw|t3}} <span v-if="e.left.cones">(+{{e.left.cones}})</span></td>
                    <td class='diff'>{{e.left.status !== 'OK' ? e.left.status : t3(e.left.net - e.dial) }}</td>
                </template>
                <template v-else>
                    <td></td><td></td><td></td><td></td><td></td>
                </template>

                <td rowspan=2 class='result'>
                    {{eTotal(e)}}
                    <template v-if="newDial(e)">
                        <br/><span class='dial'>New:  {{newDial(e)}}</span>
                    </template>
                </td>

            </tr>

            <tr :key="idx+100" :class="css">
                <template v-if="e.left">
                    <td>R</td>
                    <td>{{e.right.reaction|t3}}</td>
                    <td>{{e.right.sixty|t3}}</td>
                    <td>{{e.right.raw|t3}} <span v-if="e.right.cones">(+{{e.right.cones}})</span></td>
                    <td class='diff'>{{e.right.status !== 'OK' ? e.right.status : t3(e.right.net - e.dial) }}</td>
                </template>
                <template v-else>
                    <td></td><td></td><td></td><td></td><td></td>
                </template>
            </tr>
        </template>
    </table>
</template>

<script>
import { t3 } from '@/util/filters'

export default {
    name: 'SingleRound',
    props: {
        round: Object
    },
    data() {
        return {
            t3: t3
        }
    },
    computed: {
        sides() {
            if (!this.round) return []
            return [
                { e: this.round.e1, css: this.round.winner === 1 ? 'winner' : '' },
                { e: this.round.e2, css: this.round.winner === 2 ? 'winner' : '' }]
        }
    },
    methods: {
        eTotal(e) {
            if (!e.left || !e.right)                       { return '' }
            if (e.left.status && e.left.status !== 'OK')   { return e.left.status }
            if (e.right.status && e.right.status !== 'OK') { return e.right.status }
            if (e.left.net === 0.0 || e.right.net === 0.0) { return '' }
            return t3(e.left.net + e.right.net - (2 * e.dial))
        },
        newDial(e) {
            if (e.newdial !== e.dial && e.newdial !== 0.0) { return t3(e.newdial) }
            return ''
        }
    }
}
</script>

<style lang="scss" scoped>
.challengeround {
    width: 100%;
    padding: 1px;
    td {
        white-space: nowrap;
        background: white;
        font-size: 90%;
    }
    tr.head {
        th {
            font-size: 80%;
        }
        th.entrant, th.dial {
            text-align: center;
        }
    }
    tr.winner td {
        background: #fdf2b5;
    }
    .dial {
        font-weight: bold;
        text-align: center;
    }
    .total, .diff, .dial {
        font-size: 1rem;
    }
    td.result {
        text-align: center;
        font-size: 1.2em;
    }
}

.entrantwrap {
    .name {
        display: block;
    }
    .class {
        display: inline-block;
        width: 2.5rem;
    }
}
</style>
