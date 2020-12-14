<template>
    <div class='outer'>
        <div class='carsgrid'>
            <CarCard :car="car" v-for="car in orderedCars" :key="car.carid"
                @editcar="openDialog(car, 'update')"
                @editdesc="openDialog(car, 'update', true)"
                @deletecar="openDialog(car, 'delete')">
            </CarCard>
        </div>

        <v-btn dark class='flexbutton' color="secondary" @click.stop="openDialog(undefined, 'insert')">Add Car</v-btn>
        <CarDialog v-model=dialogOpen :car=dialogCar :apiType=apiType :descOnly=descOnly @save='dialogSave'></CarDialog>
    </div>
</template>

<script>
import orderBy from 'lodash/orderBy'
import { mapState } from 'vuex'
import CarCard from '../../components/CarCard.vue'
import CarDialog from '../../components/CarDialog.vue'

export default {
    components: {
        CarCard,
        CarDialog
    },
    data() {
        return {
            dialogOpen: false,
            dialogCar: { attr: {}},
            apiType: '',
            descOnly: false,
            loadingCard: undefined
        }
    },
    computed: {
        ...mapState(['series', 'cars', 'errors']),
        orderedCars() {
            const ret = orderBy(this.cars, ['classcode', 'number'])
            if (this.loadingCard) ret.push(this.loadingCard)
            return ret
        }
    },
    methods: {
        openDialog(car, api, desc = false) {
            this.dialogCar = car
            this.apiType = api
            this.descOnly = desc
            this.dialogOpen = true
        },
        dialogSave(cardata) {
            // Called when the ok action in the dialog is taken, on new car show a place holder
            if (!this.dialogCar) {
                this.loadingCard = cardata
            }
        }
    },
    watch: {
        cars: function() { this.loadingCard = undefined }, // on new car data
        dialogOpen: function(newv) { if (!newv) { this.dialogCar = undefined } } // on dialog close
    }
}
</script>

<style scoped lang='scss'>
    .carsgrid {
        display: flex;
        column-gap: 1rem;
        row-gap: 1rem;
        flex-wrap: wrap;
        .carcard {
            flex: 1 0;
            max-width: max(30rem, 50%);
        }
    }
    .flexbutton {
        display: block;
        width: 15rem;
        margin: 1rem auto 0 auto;
    }

    @media (max-width: 800px) {
        .outer {
            margin: 1rem; // don't double with mainwrap
        }
        .flexbutton {
            width: 100%;
        }
    }
</style>

<style>
    .v-main__wrap {
        xmargin: 1rem; /* don't collapse on small screens */
    }
</style>
