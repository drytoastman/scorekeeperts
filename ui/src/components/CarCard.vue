<template>
    <v-card class='carcard' elevation='6' :disabled='car.busy' :loading='car.busy' min-width='15rem'>
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
import CarLabel from './CarLabel'
export default {
    components: { CarLabel },
    props: { car: Object }
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
