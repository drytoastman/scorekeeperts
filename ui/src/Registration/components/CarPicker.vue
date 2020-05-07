<template>
    <v-speed-dial v-model="open" direction="top">
        <template v-slot:activator>
            <v-btn v-model="open" :color="disabled ? 'grey' : 'blue'" dark fab>
                <span v-if="disabled">Max</span>
                <v-icon v-else-if="open">mdi-close</v-icon>
                <span v-else>Reg</span>
            </v-btn>
        </template>
        <v-btn elevation=8 v-for="car in pickableCars" :key="car.carid" @click="addReg(car)" x-large color="white">
            <CarLabel :car="car"></CarLabel>
        </v-btn>
        <span></span> <!-- keep speed-dial from removing button if nothing pickable -->
    </v-speed-dial>
</template>

<script>
import { mapState } from 'vuex'
import _ from 'lodash'
import CarLabel from '../../components/CarLabel'
import { Event } from '@common/lib'

export default {
    props: {
        event: Event,
        inuse: Array
    },
    components: {
        CarLabel
    },
    data: () => ({
        open: false,
        up: 'up'
    }),
    computed: {
        ...mapState(['series', 'cars']),
        pickableCars() {
            const rids = this.inuse.map(r => r.carid)
            return _.orderBy(Object.values(this.cars).filter(c => !rids.includes(c.carid)), ['classcode', 'number']).reverse()
        },
        disabled() {
            return this.pickableCars.length === 0
        }
    },
    methods: {
        addReg(car) {
            console.log(`${car.carid} ${this.event.eventid}`)
            this.$store.dispatch('setdata', {
                series: this.series,
                type: 'insert',
                registered: [{
                    carid: car.carid,
                    eventid: this.event.eventid,
                    session: ''
                }]
            })
            // Vue.set(this.reg, 'busy', true)
        }
    }
}
</script>

<style scoped>
.carlabel {
    width: 11rem;
}
.v-speed-dial {
    margin-left: 1rem;
}
</style>
