<template>
    <div>
        <div class='title'>Upcoming Entries</div>
        <div class='eventsummary' v-for="s in summary" :key="s.eventid">
            <div class='eventinfo'>
                <span class='date'>{{s.date | dmdy}}</span>
                <span class='series'>{{s.series}}</span>
                <span class='ename'>{{s.name}}</span>
            </div>
            <ol>
                <li v-for="r in s.reg" :key="r.carid+r.session">
                    <div v-if="r.session">
                        <div class='session'>Session: {{r.session}}</div>
                        <CarLabel :car="r" session></CarLabel>
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

export default {
    name: 'SummaryDisplay',
    components: {
        CarLabel
    },
    computed: {
        ...mapState(['summary'])
    }
}
</script>

<style scoped>
.eventsummary {
    border-top: 1px solid #CCC;
    margin-top: 10px;
    padding-top: 10px;
}
.eventsummary:nth-child(2) {
    border: none;
    padding-top: 0;
}

.ename {
    font-weight: bold;
    display: block;
}
.date {
    color: var(--v-secondary-darken1);
    margin-right: 0.7rem;
}
.series {
    font-style: italic;
}
</style>
