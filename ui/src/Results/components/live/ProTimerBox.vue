<template>
    <table class='live' v-if="timedata">
        <tbody>
            <tr v-for="(row, idx) of timedata" :key="idx">
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
        timedata: Object
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
