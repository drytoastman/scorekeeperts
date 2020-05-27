<template>
    <div>
        <div class='title'>Upcoming Entries</div>
        <div v-for="s in summary" :key="s.eventid">
            <div class='eventinfo'>
                <span class='ename'>{{s.series}} - {{s.name}}</span>
                <span class='date'>{{s.date | dmdy}}</span>
            </div>
            <ol>
                <li v-for="r in s.reg" :key="r.carid">
                    <div v-if="r.session">
                        <SessionCarLabel :car="r" fontsize="110%"></SessionCarLabel>
                        <div class='session'>Session: {{r.session}}</div>
                    </div>
                    <CarLabel v-else :car="r" fontsize="110%"></CarLabel>
                </li>
            </ol>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import CarLabel from '../../components/CarLabel'
import SessionCarLabel from '../../components/SessionCarLabel'

export default {
    name: 'SummaryDisplay',
    components: {
        CarLabel,
        SessionCarLabel
    },
    computed: {
        ...mapState(['summary'])
    }
}
</script>

<style scoped>
.eventinfo {
    border-top: 1px solid #CCC;
    margin-top: 10px;
    padding-top: 10px;
    margin-bottom: 5px;
}
.ename {
    font-weight: bold;
    display: block;
}
</style>
