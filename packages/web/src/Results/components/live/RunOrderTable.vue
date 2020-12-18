<template>
    <div>
        <div v-if="!order">Waiting for data</div>
        <table class='live runorder'>
            <tbody>
                <tr class='head'><th :colspan='small?5:6'>Next To Finish</th></tr>
                <tr class='subhead'>
                    <th>Name</th>
                    <th v-if="!small">Car</th>
                    <th>Class</th>
                    <th>Best</th>
                    <th>Pos</th>
                    <th>Need</th>
                </tr>
                <tr v-for="e in order.next" :key="e.carid">
                    <td class='name limit'>{{e.firstname}} {{e.lastname}}</td>
                    <td v-if="!small" class='limit'>{{e.year}} {{e.model}} {{e.color}}</td>
                    <td>{{e.classcode}}</td>
                    <td><span v-if="e.bestrun">{{e.bestrun.raw|t3}} ({{e.bestrun.cones}}, {{e.bestrun.gates}})</span></td>
                    <td>{{e.position}}</td>
                    <td>{{e.diffn|t3}}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
export default {
    name: 'RunOrderTable',
    props: {
        order: Object,
        small: Boolean
    },
    methods: {
    }
}
</script>

<style lang="scss" scoped>
    td {
        /* for overflow to work */
        max-width: 9rem;
    }
</style>
