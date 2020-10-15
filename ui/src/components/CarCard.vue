<template>
    <v-card class='carcard' elevation='6' :disabled='busy' :loading='busy'>
        <v-card-title>
            <CarLabel :car=car></CarLabel>
        </v-card-title>
        <v-card-actions v-if="!inreg">
            <v-btn color="primary" outlined @click="$emit('editcar', car)">Edit</v-btn>
            <v-btn color="primary" outlined @click="$emit('deletecar', car)">Delete</v-btn>
        </v-card-actions>
        <v-card-actions v-else>
            <v-btn color="primary" outlined @click="$emit('editdesc', car)">Edit Description</v-btn>
            <div class='inuse' v-if="inreg">In Use</div>
        </v-card-actions>
    </v-card>
</template>

<script>
import flatten from 'lodash/flatten'
import { mapState } from 'vuex'
import CarLabel from './CarLabel.vue'
export default {
    components: { CarLabel },
    props: { car: Object },
    computed: {
        ...mapState(['busyCars', 'registered']),
        busy()   { return this.busyCars[this.car.carid] },
        regids() { return flatten(Object.values(this.registered).map(m => Object.values(m))).map(c => c.carid) },
        inreg()  { return Boolean(this.regids.includes(this.car.carid)) }
    }
}
</script>

<style scoped lang='scss'>
.carcard {
    display: grid;
    grid-template-rows: auto 3rem;
    .v-card__title {
        align-items: flex-start;
    }
}
.v-card--disabled > :not(.v-card__progress) {
    opacity: 0.3;
}
.inuse {
    margin-left: 1rem;
    color: #A33;
}
</style>
