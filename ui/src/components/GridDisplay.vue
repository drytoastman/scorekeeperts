<template>
    <div>
        <h2>{{grid}}</h2>
        <table>
            <template v-for="ce of classes">
                <template v-for="e of ce.firsts">
                    <tr :key="e.grid+1000000">
                        <td :key="e.grid">{{e.grid}}</td>
                        <td :key="e.grid+1000">{{e.number}} ({{ce.classcode}})</td>
                    </tr>
                </template>
            </template>
        </table>
    </div>
</template>

<script>
export default {
    name: 'GridDisplay',
    props: {
        classes: Array,
        grid: Number
    },
    data() {
        return {
        }
    },
    computed: {
    }
}
</script>

<style scoped lang="scss">
table {
    border-collapse: collapse;
}
td {
    border: 1px solid black;
    padding: 0.5rem;
}
</style>
