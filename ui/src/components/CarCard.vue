<template>
    <v-card class='carcard' elevation='6' :disabled='busy' :loading='busy' min-width='15rem'>
        <v-card-title>
            <CarLabel :car=car></CarLabel>
        </v-card-title>
        <v-card-actions>
            <v-btn text @click="$emit('editcar', car)">Edit</v-btn>
            <v-btn text @click="$emit('deletecar', car)">Delete</v-btn>
        </v-card-actions>
    </v-card>
</template>

<script>
import { mapState } from 'vuex'
import CarLabel from './CarLabel'
export default {
    components: { CarLabel },
    props: { car: Object },
    computed: {
        ...mapState(['busyCars']),
        busy() { return this.busyCars[this.car.carid] }
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
</style>
