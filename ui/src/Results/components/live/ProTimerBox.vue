<template>
    <table class='live' v-if="timerdata">
        <tbody>
            <tr v-for="(row, idx) of entries" :key="idx">
                <td :class='`reaction ${row.status}`'>{{row.reaction|t3}}</td>
                <td :class='`sixty ${row.status}`'>{{row.sixty|t3}}</td>
                <td :class='`raw ${row.status}`'>{{row.raw|t3}}</td>
            </tr>
        </tbody>
    </table>
    <div v-else>
        Waiting for timer data
    </div>
</template>

<script>
export default {
    name: 'ProTimerBox',
    props: {
        timerdata: Array
    },
    computed: {
        entries() {
            const ret = [...this.timerdata]
            while (ret.length < 3) {
                ret.unshift({})
            }
            return ret
        }
    }
}
</script>

<style lang="scss" scoped>
td {
    text-align: center;
    vertical-align: middle;
    height: 3rem;
    font-size: 110%;
}
.RL { color: red; }
.NS { color: blue; }
.raw { font-size: 200%; }
</style>
