<template>
    <table v-if="champ" class='res'>
        <tbody>
            <tr class='head'><th colspan='4'>Champ - {{champ.classcode}}</th></tr>
            <tr class='subhead'><th>#</th><th>Name</th><th></th><th>Points</th></tr>
            <tr v-for="e in champ.order" :key="e.driverid" :class="rowclass(e)">
                <td>{{e.position}}</td>
                <td>{{e.firstname}} {{e.lastname}}</td>
                <td>{{e.eventcount}}</td>
                <td>{{e.points.total | t3}}</td>
            </tr>
        </tbody>
    </table>
</template>

<script>
export default {
    name: 'ChampTable',
    props: {
        champ: Object,
        display: String
    },
    methods: {
        rowclass(e) {
            const c = []
            if (e.current)     c.push('highlight')
            if (e.ispotential) c.push('couldhave')
            if (e.isold)       c.push('improvedon')
            return c.join(' ')
        }
    }
}
</script>
