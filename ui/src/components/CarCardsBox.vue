<template>
    <v-container>
        <v-row dense>
            <v-col v-for="car in orderedCars" :key="car.carid">
                <CarDisplay :car="car" @editcar='editCar' @deletecar='deleteCar'></CarDisplay>
            </v-col>
            <v-col class='carspacer align-self-center text-center'>
                <v-btn dark :class="usefixed ? 'fixedbutton' : 'flexbutton'" color="secondary" @click.stop=addCar>Add Car</v-btn>
            </v-col>
            <v-spacer class='carspacer'></v-spacer>
            <v-spacer class='carspacer'></v-spacer>
            <v-spacer class='carspacer'></v-spacer>
            <v-spacer class='carspacer'></v-spacer>
            <v-spacer class='carspacer'></v-spacer>
            <v-spacer class='carspacer'></v-spacer>
            <v-col>
            </v-col>
        </v-row>
        <CarDialog v-model=dialogOpen :title=dialogTitle :car=dialogCar :apiType=apiType @save='dialogSave'></CarDialog>
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
        orderedCars() {
            const ret = _.orderBy(this.cars, ['classcode', 'number'])
            if (this.loadingCard) ret.push(this.loadingCard)
            return ret
        },
        usefixed() {
            switch (this.$vuetify.breakpoint.name) {
                case 'xs': return true
                case 'sm': return true
                default: return false
            }
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
            // Called when the ok action in the dialog is taken, on new car show a place holder
            if (!this.dialogCar) {
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
    .fixedbutton {
        position: fixed;
        width: 50%;
        bottom: 10px;
        left: 0;
        right: 0;
        margin-left: auto;
        margin-right: auto;
    }
    .flexbutton {
        margin-top: 1rem;
    }
</style>
