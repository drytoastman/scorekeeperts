<template>
    <div class='outer'>
        <h2>{{type|capitalize}} Attendance</h2>
        <ul>
            <li v-for="list in lists" :key="list.key">
                <span v-if="list.event" class='ename'>{{list.event.name}}</span>
                <span v-if="list.event" class='edate'> - {{list.event.date|dmdy}} - </span>
                <span class='count'>{{list.attendance.length}}</span>

                <ul>
                    <li v-for="driver in list.attendance" :key="driver.driverid">
                        <span class='name'>{{driver.lastname}}, {{driver.firstname}}</span>
                    </li>
                </ul>
            </li>
        </ul>
    </div>
</template>

<script>
import sortBy from 'lodash/sortBy'
import isEmpty from 'lodash/isEmpty'
import { mapState, mapGetters } from 'vuex'
export default {
    name: 'Attendance',
    props: {
        type: String
    },
    data() {
        return {
            dataLoaded: false
        }
    },
    computed: {
        ...mapState(['drivers', 'attendance']),
        ...mapGetters(['orderedEvents']),
        lists() {
            if (!this.dataLoaded) return []
            if (this.type === 'series') return this.seriesList

            const ret = []
            const driverset = (this.type === 'unique') ? new Set() : undefined
            for (const event of this.orderedEvents) {
                const attend = this.getEventAttendance(event.eventid, driverset)
                if (!attend.length) continue
                ret.push({ key: event.eventid, event: event, attendance: attend })
            }
            return ret
        },
        seriesList() {
            const all = []
            const driverset = new Set()
            for (const list of Object.values(this.attendance)) {
                for (const driverid of list) {
                    if (driverset.has(driverid)) continue
                    driverset.add(driverid)
                    if (driverid in this.drivers) {
                        all.push(this.drivers[driverid])
                    }
                }
            }
            return [{ key: 'series', attendance: sortBy(all, [d => d.lastname.toLowerCase(), d => d.firstname.toLowerCase()]) }]
        }
    },
    methods: {
        getEventAttendance(eventid, driverset) {
            const ret = []
            if (eventid in this.attendance) {
                for (const driverid of this.attendance[eventid]) {
                    const driver = this.drivers[driverid]
                    if (driverset) {
                        if (driverset.has(driver.driverid)) continue
                        driverset.add(driver.driverid)
                    }
                    ret.push(driver)
                }
            }
            return sortBy(ret, [d => d.lastname.toLowerCase(), d => d.firstname.toLowerCase()])
        }
    },
    async mounted() {
        const torun = [this.$store.dispatch('ensureSeriesCarDriverInfo')]
        if (isEmpty(this.attendance)) { torun.push(this.$store.dispatch('getdata', { items: 'attendance' })) }

        Promise.all(torun).then(() => {
            this.dataLoaded = true
        })
    }
}
</script>

<style scoped>
ul {
    list-style: none;
}
li > ul {
    columns: 3;
}
.ename, .count {
    font-size: 1.2rem;
    font-weight: bold;
}
.name {
    display: inline-block;
    width: 10rem;
}
</style>
