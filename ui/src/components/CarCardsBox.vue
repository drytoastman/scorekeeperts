<template>
    <v-container>
        <v-row dense>
            <v-col v-for="car in orderedCars" :key="car.carid">
                <CarDisplay :car="car" @editcar='editCar' @deletecar='deleteCar'></CarDisplay>
            </v-col>
            <v-spacer class='carspacer'></v-spacer>
            <v-spacer class='carspacer'></v-spacer>
            <v-spacer class='carspacer'></v-spacer>
            <v-spacer class='carspacer'></v-spacer>
            <v-spacer class='carspacer'></v-spacer>
            <v-spacer class='carspacer'></v-spacer>
        </v-row>
        <CarDialog v-model=dialogOpen :title=dialogTitle :car=dialogCar :actionName=actionName @save='dialogSave'></CarDialog>
        <v-btn dark fixed bottom right fab color="secondary" @click.stop=addCar>Add</v-btn>
    </v-container>
</template>

<script>
import { mapState } from 'vuex'
import Vue from 'vue'
import CarDisplay from '../components/CarCard'
import CarDialog from '../components/CarDialog'
import _ from 'lodash'

export default {
    components: {
        CarDisplay,
        CarDialog
    },
    data() {
        return {
            dialogOpen: false,
            dialogTitle: 'Title here',
            dialogCar: { attr: {} },
            apiType: '',
            loadingCard: undefined
        }
    },
    computed: {
        ...mapState(['series', 'cars', 'errors']),
        actionName() {
            switch (this.apiType) {
            case 'insert': return 'Create'
            case 'update': return 'Update'
            case 'delete': return 'Delete'
            default: return '???'
            }
        },
        orderedCars() {
            const ret = _.orderBy(this.cars, ['classcode', 'number'])
            if (this.loadingCard) ret.push(this.loadingCard)
            return ret
        }
    },
    methods: {
        addCar() {
            this.dialogCar = undefined
            this.dialogTitle = 'Add Car'
            this.dialogOpen = true
            this.apiType = 'insert'
        },
        editCar(car) {
            this.dialogCar = car
            this.dialogTitle = 'Edit Car'
            this.dialogOpen = true
            this.apiType = 'update'
        },
        deleteCar(car) {
            this.dialogCar = car
            this.dialogTitle = 'Delete Car'
            this.dialogOpen = true
            this.apiType = 'delete'
        },
        dialogSave(cardata) {
            // Called when the ok action in the dialog is taken
            this.$store.dispatch('setdata', {
                series: this.series,
                type: this.apiType,
                cars: [cardata]
            })
            if (this.dialogCar) {
                Vue.set(this.dialogCar, 'busy', true)
            } else {
                this.loadingCard = cardata
                Vue.set(this.loadingCard, 'busy', true)
            }
        }
    },
    watch: {
        cars: function() { this.loadingCard = undefined }, // on new car data
        dialogOpen: function(newv) { if (!newv) { this.dialogCar = undefined } } // on dialog close
    }
}
</script>

<style scoped>
    .carspacer {
        min-width: 15rem;
        padding: 4px;
    }
</style>
