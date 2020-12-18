<template>
    <div>
        <div class='title'>
            <span class=''>Upcoming Entries</span>
            <a class='icallink' :href="icallink"><v-icon color="secondary">{{mdiCalendarClock}}</v-icon> ical</a>
        </div>
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
import { mdiCalendarClock } from '@mdi/js'
import { API2 } from '@/store/state'
import CarLabel from '../../components/CarLabel'

export default {
    name: 'SummaryDisplay',
    components: {
        CarLabel
    },
    data() {
        return {
            mdiCalendarClock
        }
    },
    computed: {
        ...mapState(['summary', 'driverid']),
        icallink() { return API2.ICAL.replace('DRIVERID', this.driverid) }
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
.title {
    display: flex;
    align-items: center;
    column-gap: 1rem;
}
.icallink {
    font-size: 65%;
    color: var(--v-secondary-darken2);
    text-decoration: none;
}
</style>
