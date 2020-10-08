<template>
    <v-row justify="center">
        <v-dialog :value="value" @input="$emit('input')" persistent max-width="500px">
            <v-card>
                <v-card-title>
                    Add to Cart ({{account.name}})
                    <!-- <v-btn class='close' icon @click="$emit('input')"><v-icon>{{closeIcon}}</v-icon></v-btn> -->
                </v-card-title>

                <v-card-text class='cart'>
                    <div v-if="event">
                        <div v-for="r in registered[event.eventid]" :key="r.eventid+r.carid+r.session">
                            <CarPayment :event=event :car=cars[r.carid] :session="r.session"></CarPayment>
                        </div>
                        <div v-for="other in otherfees" :key="other.item.itemid">
                            <OtherPayment :event=event :item="other.item" :map="other.map"></OtherPayment>
                        </div>
                    </div>
                </v-card-text>

                <v-card-actions>
                    <v-btn text @click="$emit('input')">Return To Events</v-btn>
                    <!-- <v-btn text>Go To Cart</v-btn> -->
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-row>
</template>

<script>
import { mdiCloseBox } from '@mdi/js'
import { mapState } from 'vuex'
import CarPayment from './CarPayment.vue'
import OtherPayment from './OtherPayment.vue'

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
        ...mapState(['registered', 'cars', 'paymentaccounts']),
        otherfees() { return this.$store.getters.eventotherfees(this.event.eventid) },
        account() {
            if (!this.event) return {}
            return this.$store.state.paymentaccounts[this.event.accountid] || {}
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
