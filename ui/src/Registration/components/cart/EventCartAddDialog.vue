<template>
    <v-row justify="center">
        <v-dialog :value="value" @input="$emit('input')" persistent max-width="500px">
            <v-card>
                <v-card-title>
                    Add to Cart ({{account.name}})
                    <v-btn class='close' icon @click="$emit('input')"><v-icon>{{closeIcon}}</v-icon></v-btn>
                </v-card-title>

                <v-card-text class='cart'>
                    <div>
                        <div v-for="r in registered[event.eventid]" :key="r.eventid+r.carid+r.session">
                            <CarPayment :event=event :car=cars[r.carid]></CarPayment>
                        </div>
                        <div v-for="other in otherfees" :key="other.item.itemid">
                            <OtherPayment :event=event :item="other.item" :map="other.map"></OtherPayment>
                        </div>
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-row>
</template>

<script>
import orderBy from 'lodash/orderBy'
import { mdiCloseBox } from '@mdi/js'
import { mapState } from 'vuex'

import CarPayment from './CarPayment.vue'
import OtherPayment from './OtherPayment.vue'
import { ITEM_TYPE_GENERAL_FEE } from '@/common/payments.ts'

export default {
    components: {
        CarPayment,
        OtherPayment
    },
    props: {
        value: Boolean,
        event: Object
    },
    data() {
        return {
            closeIcon: mdiCloseBox,
            opened: false
        }
    },
    computed: {
        ...mapState(['registered', 'cars', 'payments', 'paymentitems', 'paymentaccounts']),
        account() { return this.$store.state.paymentaccounts[this.event.accountid] || {} },
        items() {
            const itemids = this.event.items.map(m => m.itemid)
            return Object.values(this.paymentitems).filter(i => itemids.includes(i.itemid))
        },
        otherfees() {
            return this.items.filter(i => i.itemtype === ITEM_TYPE_GENERAL_FEE).map(i => ({
                item: i,
                map: this.event.items.filter(m => m.itemid === i.itemid)[0]
            }))
        }
    }
}
</script>

<style lang='scss'>
.v-card__actions {
    padding: 0.8rem !important;
    justify-content: end;
}
.close {
    margin-left: auto;
}
@import '@/styles/cart.scss'
</style>
