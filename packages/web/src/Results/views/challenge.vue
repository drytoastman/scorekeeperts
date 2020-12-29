<template>
<div class='bracketwrap'>
    <v-dialog v-model='dialog' max-width='700'>
        <SingleRound :round="dialogRound"></SingleRound>
    </v-dialog>

    <div class='title' v-if="!$route.query.gui">{{challenge.name}}</div>

    <div class="bracket" v-if="Object.keys(results).length">
        <ul v-for="(column, idx) in roundlist" :key="column[0][0]" :class="'round column-'+idx">
            <template v-for="[rndnum,rnd] in column">
                <li       :key="rndnum+6000" class="bspacer"></li>
                <EDisplay :key="rndnum+1000" :rndnum=rndnum top :winner="rnd.winner === 1" :entrant="rnd.e1"></EDisplay>
                <li       :key="rndnum+2000" class="runoff bspacer" :onclick="`openround(${rndnum})`"></li>
                <EDisplay :key="rndnum+3000" :rndnum=rndnum     :winner="rnd.winner === 2" :entrant="rnd.e2"></EDisplay>
                <li       :key="rndnum+4000" class="bspacer"></li>
            </template>
        </ul>
        <ul class="round">
            <li class="bspacer"></li>
            <EDisplay :rndnum=0 winner top :entrant="results[0].e1"></EDisplay>
            <li class="bspacer"></li>
        </ul>
    </div>

    <br/>

    <div class="bracket" v-if="results[99]" :style="thirdroundoffset">
        <ul class="round">
            <li class="bspacer"></li>
            <EDisplay :rndnum=99 :winner="results[99].winner===1" top :entrant="results[99].e1"></EDisplay>
            <li class="runoff bspacer" onclick="openround(99)"></li>
            <EDisplay :rndnum=99 :winner="results[99].winner===2"     :entrant="results[99].e2"></EDisplay>
            <li class="bspacer"></li>
        </ul>
        <ul class="round">
            <li class="bspacer"></li>
            <EDisplay :rndnum=0 winner top :entrant="results[0].e2"></EDisplay>
            <li style="flex-grow:4;"></li>
        </ul>
    </div>
</div>
</template>

<script>
import range from 'lodash/range'
import { mapGetters } from 'vuex'
import { RANKS } from 'sctypes/challenge'
import EDisplay from '../components/standard/EDisplay.vue'
import SingleRound from '../components/standard/SingleRound.vue'

export default {
    name: 'BracketView',
    components: {
        EDisplay,
        SingleRound
    },
    props: {
        chalslug: String
    },
    data() {
        return {
            results: {},
            ranks: RANKS,
            dialog: false,
            dialogRound: {}
        }
    },
    computed: {
        ...mapGetters(['challengeInfo']),
        challenge()  { return this.challengeInfo(this.chalslug) },
        roundlist() {
            const ret = []
            const baserounds = 2 ** (this.challenge.depth - 1)
            for (const depth of range(this.challenge.depth)) {
                const column = []
                const rounds = baserounds / (2 ** depth)
                for (const d2 in range(rounds)) {
                    const rndnum = rounds * 2 - d2 - 1
                    column.push([rndnum, this.results[rndnum]])
                }
                ret.push(column)
            }
            return ret
        },
        thirdroundoffset() {
            return `
                position: relative;
                left: ${11 * (this.challenge.depth - 1)}rem;
                top: -${this.challenge.depth - 1}rem;
            `
        }
    },
    methods: {
        getdata() {
            this.$store.dispatch('getdata', { items: 'challengeresults', challengeid: this.chalslug }).then(res => {
                if (res) {
                    this.results = res.challengeresults
                }
            })
        },
        or(rndnum) {
            this.dialogRound = this.results[rndnum]
            this.dialog = true
        }
    },
    watch: {
        chalslug(nv) { if (nv) this.getdata() }
    },
    mounted() {
        window.openround = e => { // hacky way to let the JavaFX GUI still modify behavior in a webpack environmnt
            this.or(e)
        }
        this.getdata()
    }
}
</script>

<style lang="scss" scoped>
.bracketwrap {
    padding: 0 1rem;
}

.bracket {
    display: inline-flex;
    flex-direction: row;
}

.round {
    font-size: 0.8rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 11rem;
    list-style: none;
    padding: 0;
}

::v-deep {
    .round .bspacer               { flex-grow: 1.25; min-height: 0.5rem; }
    .round .runoff.bspacer        { flex-grow: 5.00; min-height: 0.8rem; }
    .round li.runoff              { flex-grow: 0.00; }

    li.runoff             { padding-left: 7px; }
    li.runoff.winner      { font-weight: bold; }
    li.runoff   span.dial { float: right; margin-right: 5px; }
    li.runoff   span.rank { display: none; }
    ul.column-0 span.rank {
        display: inline-block;
        font-size: 0.7rem;
        margin-left: -1.2rem;
        width: 0.8rem;
        text-align: right;
        margin-right: 5px;
    }

    li.runoff.top     { border-bottom: 1px solid #aaa; min-height: 1rem; }
    li.runoff.bspacer { border-right:  1px solid #aaa; }
    li.runoff.bottom  { border-top:    1px solid #aaa; }
}
</style>
