<template>
    <div>
        <div class='header'>Set External Time</div>
        <div class='inputsgrid'>
        <v-select v-model="driver" style="grid-area: driver" label="Driver" :items="driverlist" item-value="driverid" return-object>
            <template v-slot:item="d">
                {{ d.item.firstname }} {{d.item.lastname}}
            </template>
            <template v-slot:selection="d">
                {{ d.item.firstname }} {{d.item.lastname}}
            </template>
        </v-select>
        <v-select v-model="classcode"   style="grid-area: class"  label="Class"  :items="classcodes"></v-select>
        <v-text-field v-model="nettime" style="grid-area: time"   label="Net Time" :rules=[isDecimal3]></v-text-field>
        <v-btn color='secondary' dark   style="grid-area: button" @click='setResult'>Set</v-btn>
        </div>
        <div v-for="e in orderedEvents" :key="e.eventid">
            {{e.name}}:
            <span class='attend' v-for="c in getClasses(driver.driverid, e.eventid)" :key="c.classcode">
                {{c.classcode}} <span v-if="c.indexcode">[{{c.indexcode}}]</span>
            </span>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import orderBy from 'lodash/orderBy'
import mapKeys from 'lodash/mapKeys'
import { isDecimal3 } from 'sctypes/util'

export default {
    name: 'AddExternalResult',
    components: {
    },
    props: {
        seriesevent: Object
    },
    data() {
        return {
            driver: {},
            classcode: '',
            nettime: 0,
            isDecimal3
        }
    },
    computed: {
        ...mapState(['drivers', 'events', 'classes', 'dattendance']),
        ...mapGetters(['orderedEvents']),
        classcodes() {
            return Object.keys(this.classes).sort().filter(c => c !== 'HOLD')
        },
        driverlist() {
            return orderBy(Object.keys(this.dattendance).map(did => this.drivers[did]), [d => d.firstname.toLowerCase(), d => d.lastname.toLowerCase()])
        },
        attended() {
            return mapKeys(this.dattendance[this.driver.driverid], (v, k) => { return this.events[k].name })
        }
    },
    methods: {
        setResult() {
            this.$store.dispatch('setdata', {
                type: 'upsert',
                items: {
                    externalresults: [{
                        eventid: this.seriesevent.eventid,
                        driverid: this.driver.driverid,
                        classcode: this.classcode,
                        net: +this.nettime
                    }]
                }
            })
        },
        getClasses(driverid, eventid) {
            if ((!driverid) || (!eventid)) return undefined
            return this.dattendance[driverid][eventid]
        },
        reset() {
            this.$store.dispatch('getdata', { items: 'dattendance', eventid: this.seriesevent.eventid })
        }
    },
    watch: { seriesevent() { this.reset() } },
    mounted() { this.reset() }
}
</script>

<style scoped>
.header {
    margin-top: 1rem;
    font-size: 130%;
}
.inputsgrid {
    display: grid;
    grid-template-columns: 3fr 3fr 3fr 2fr;
        grid-template-areas: "driver class time button";
    column-gap: 1rem;
}
.attend {
    margin-left: 0.5rem;
}
</style>
