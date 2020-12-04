<template>
    <li :class="css">
        <span class='rank'>{{rank}}</span>
        <span v-if="entrant.firstname">{{entrant.firstname}} {{entrant.lastname}}</span>
        <span v-else>&zwnj;</span>
        <span class='dial'>{{dial}}</span>
    </li>
</template>

<script>
import { t3 } from '@/util/filters'
import { RANKS } from '@/common/challenge'

export default {
    name: 'EDisplay',
    props: {
        rndnum: Number,
        top: Boolean,
        winner: Boolean,
        entrant: Object
    },
    computed: {
        rank()    { return RANKS[this.rndnum * 2 + (this.top ? 1 : 0)] },
        css()     { return 'runoff ' + (this.top ? 'top ' : 'bottom ') +  (this.winner ? 'winner' : '') },
        dial()    {
            const d = this.entrant.dial
            return (d && d < 999) ? t3(d) : ''
        }
    }
}
</script>
