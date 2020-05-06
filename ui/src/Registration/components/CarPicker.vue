<template>
    <v-speed-dial v-model="fab" direction="top">
        <template v-slot:activator>
            <v-btn v-model="fab" color="blue darken-2" dark fab>
                <v-icon v-if="fab">mdi-close</v-icon>
                <span v-else>Add</span>
            </v-btn>
        </template>
        <v-btn elevation=8 v-for="car in cars" :key="car.carid" @click="addReg(car)" x-large color="white">
            <CarLabel :car="car"></CarLabel>
        </v-btn>
    </v-speed-dial>
</template>

<script>
import { mapState } from 'vuex'
import CarLabel from '../../components/CarLabel'
import { Event } from '@common/lib'

export default {
    props: {
        event: Event
    },
    components: {
        CarLabel
    },
    data: () => ({
        fab: false,
        up: 'up'
    }),
    computed: {
        ...mapState(['series', 'cars'])
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
