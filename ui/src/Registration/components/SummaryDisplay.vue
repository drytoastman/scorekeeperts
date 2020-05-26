<template>
    <div class='outer'>
        <div class='name'>Upcoming Entries</div>
        <div v-for="s in summary" :key="s.eventid">
            <div>{{s.date | titledate}} {{s.series}} {{s.name}}</div>
            <ol>
                <li v-for="r in s.reg" :key="r.carid">
                    <CarLabel :car="r"></CarLabel>
                </li>
            </ol>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import CarLabel from '../../components/CarLabel'

export default {
    name: 'SummaryDisplay',
    components: {
        CarLabel
    },
    filters: {
        titledate: function(v) { return new Date(v).toDateString() }
    },
    computed: {
        ...mapState(['summary'])
    }
}
</script>

<style scoped>
.outer {
    border: 1px solid #AAA;
    border-radius: 4px;
    padding: 20px;
    width: 24rem;
}
.name {
    font-weight: bold;
    font-size: 120%;
    margin-left: -5px;
}
</style>
