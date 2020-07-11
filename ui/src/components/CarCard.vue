<template>
    <v-card class='carcard' elevation='6' :disabled='busy' :loading='busy' min-width='15rem'>
        <v-card-title>
            <CarLabel :car=car></CarLabel>
        </v-card-title>
        <v-card-actions>
            <v-btn text @click="$emit('editcar', car)"   :disabled="inreg">Edit</v-btn>
            <v-btn text @click="$emit('deletecar', car)" :disabled="inreg">Delete</v-btn>
            <div class='inuse' v-if="inreg">In Use</div>
        </v-card-actions>
    </v-card>
</template>

<script>
import flatMap from 'lodash/flatMap'
import find from 'lodash/find'
import { mapState } from 'vuex'
import CarLabel from './CarLabel'
export default {
    components: { CarLabel },
    props: { car: Object },
    computed: {
        ...mapState(['busyCars', 'registered']),
        busy() { return this.busyCars[this.car.carid] },
        inreg() { return Boolean(find(flatMap(this.registered), { carid: this.car.carid })) }
    }
}
</script>

<style scoped>
.v-card {
    height: 100%;
}
.v-card--disabled > :not(.v-card__progress) {
    opacity: 0.3;
}
.inuse {
    margin-left: 1rem;
    color: #A33;
}
</style>
