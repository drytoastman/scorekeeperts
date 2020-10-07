<template>
    <div class='eventgrid'>
        <CarLabel :car=car fontsize="110%"></CarLabel>
        <v-select :items="entryfees" return-object hide-details solo dense item-value="itemid" v-model="selection">
            <template v-slot:selection="d">
                <span class='name'>{{ d.item.name }}</span> <span class='price'>{{ d.item.price|cents2dollars }}</span>
            </template>
            <template v-slot:item="d">
                <span class='name'>{{ d.item.name }}</span> <span class='price'>{{ d.item.price|cents2dollars }}</span>
            </template>
        </v-select>
    </div>
</template>

<script>
import orderBy from 'lodash/orderBy'
import { mapState, mapGetters } from 'vuex'
import CarLabel from '@/components/CarLabel.vue'
import { ITEM_TYPE_ENTRY_FEE } from '@/common/payments.ts'

export default {
    components: {
        CarLabel
    },
    props: {
        event: Object,
        car: Object
    },
    computed: {
        ...mapState(['carts', 'currentSeries', 'paymentitems']),
        ...mapGetters(['cartGetCar']),
        items() {
            const itemids = this.event.items.map(m => m.itemid)
            return Object.values(this.paymentitems).filter(i => itemids.includes(i.itemid))
        },
        entryfees() {
            const arr = orderBy(this.items.filter(i => i.itemtype === ITEM_TYPE_ENTRY_FEE), 'name')
            return [{ itemid: null, name: '' }, ...arr]
        },
        selection: {
            get() {
                return this.cartGetCar(this.currentSeries, this.event.accountid, this.event.eventid, this.car.carid)
            },
            set(item) {
                this.$store.commit('cartSetCar', {
                    series: this.currentSeries,
                    accountid: this.event.accountid,
                    eventid: this.event.eventid,
                    carid: this.car.carid,
                    value: item.itemid
                })
            }
        }
    }
}
</script>

<style scoped>
.name {
    margin-right: 1rem;
    font-size: 90%;
}
</style>
