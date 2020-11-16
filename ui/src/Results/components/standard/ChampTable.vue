<template>
    <table class='champ results'>
        <template v-for="[code, entrants] of Object.entries(champresults)">
        <tr class='head' :key="code">
            <th :colspan='events.length + 4'>
                <span class='code'>{{code}} - {{classes[code] ? classes[code].descrip : ''}}</span>
                <span class='avg'>Average Per Event: {{avgperevent(code)|t3}}</span>
            </th>
        </tr>

        <tr class='subhead' :key="code+1">
            <th>#</th>
            <th>Name</th>
            <th>Attend</th>
            <th v-for="(event, idx) in events" :key="idx">Event {{idx+1}}</th>
            <th>Total</th>
        </tr>

        <tr v-for="e in entrants" :key="e.driverid+code" :class="missingmin(e)">
            <td>{{e.position}}</td>
            <td class='name'>{{e.firstname}} {{e.lastname}}</td>
            <td class='attend'>{{e.eventcount}}</td>
            <td v-for="ev of events" :key="ev.eventid" :class='eventclass(e, ev)'>{{eventpoints(e, ev)}}</td>
            <td class='total'>{{p3(e.points.total)}}</td>
        </tr>
        </template>
    </table>
</template>

<script>
import { mapState } from 'vuex'
import { t3 } from '@/util/filters'

export default {
    name: 'ChampTable',
    computed: {
        ...mapState(['champresults', 'seriesinfo']),
        events() {
            return this.seriesinfo.events.filter(e => !e.ispractice)
        },
        classes() {
            const ret = {}
            for (const c of this.seriesinfo.classes) ret[c.classcode] = c
            return ret
        },
        pointsclass() {
            if (this.seriesinfo.settings.usepospoints) return 'points pos'
            return 'points'
        }
    },
    methods: {
        avgperevent(code) {
            let sum = 0
            for (const entrant of this.champresults[code]) sum += Object.keys(entrant.points.events).length
            return sum / this.events.length
        },
        missingmin(e) {
            return (e.eventcount < this.seriesinfo.settings?.minevents || e.missingrequired.length > 0) ? 'missingmin' : ''
        },
        eventkey(entrant, event)   {
            const key = `d-${event.date}-id-${event.eventid}`
            if (key in entrant.points.events) return key
            return `d-${event.date}`
        },
        eventclass(entrant, event)  {
            if (entrant.points.drop.includes(this.eventkey(entrant, event))) return this.pointsclass + ' drop'
            return this.pointsclass
        },
        eventpoints(entrant, event) {
            return this.p3(entrant.points.events[this.eventkey(entrant, event)])
        },
        p3(points) {
            return (this.seriesinfo.settings.usepospoints) ? points : t3(points)
        }
    }
}
</script>
