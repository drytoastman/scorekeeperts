<template>
    <v-card class='carcard' elevation='6' :disabled='car.busy' :loading='car.busy' min-width='15rem'>
        <div class='d-flex flex-column fill-height'>
            <v-card-title class='d-flex'>
                <span class='code'>{{car.classcode}}</span>
                <span class='number align-self-start'>#{{car.number}}</span>
                <span class='index'>{{indexstr}}</span>
            </v-card-title>
            <v-card-subtitle>{{car.attr.year}} {{car.attr.make}} {{car.attr.model}} {{car.attr.color}}</v-card-subtitle>
            <v-spacer></v-spacer>
            <v-card-actions>
                <v-btn text @click="$emit('editcar', car)">Edit</v-btn>
                <v-btn text @click="$emit('deletecar', car)">Delete</v-btn>
            </v-card-actions>
        </div>
    </v-card>
</template>

<script>
export default {
    props: {
        car: {
            type: Object,
            default: () => ({ attr: {} })
        }
    },
    data: function () {
        return {}
    },
    computed: {
        indexstr () { return (this.car.indexcode !== '') ? `(${this.car.indexcode})` : '' }
    }
}
</script>

<style scoped>
    .v-card {
        height: 100%;
    }
    .code {
        font-size: 1.4rem;
        color: #095675;
        margin-right: 4px;
    }
    .number {
        font-size: 1.2rem;
        margin-right: 6px;
        vertical-align: super;
    }
    .index {
        font-size: 1.0rem;
        color: grey;
    }
    .v-card--disabled > :not(.v-card__progress) {
        opacity: 0.3;
    }
</style>
