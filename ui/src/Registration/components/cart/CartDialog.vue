<template>
    <v-dialog :value="value" @input="$emit('input')" persistent max-width="450px">
        <v-card>
            <v-card-title>{{account.name}} <v-btn class='close' icon @click="$emit('input')"><v-icon>{{close}}</v-icon></v-btn></v-card-title>

            <v-card-text>
                <div v-for="edata in eventpurchases" :key="edata.name">
                    <span class='eventname'>{{edata.event.name}}</span>
                    <EventPaymentList :paypurchases=edata.purchases></EventPaymentList>
                </div>
            </v-card-text>

            <v-card-text>
                <div class='total'>
                    {{cart.total|cents2dollars}}
                </div>
            </v-card-text>

            <v-card-actions>
                <PayPalButton v-if="account.type=='paypal'"
                        :opened=value :account=account :payments=payments :total=cart.total @complete=complete :purchase=cart.purchases>
                </PayPalButton>
                <SquarePaymentForm v-else
                        :opened=value :account=account :payments=payments :total=cart.total @complete=complete>
                </SquarePaymentForm>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import { mapState } from 'vuex'
import { mdiCloseBox } from '@mdi/js'
import SquarePaymentForm from './SquarePaymentForm.vue'
import PayPalButton from './PayPalButton.vue'
import EventPaymentList from './EventPaymentList.vue'

export default {
    components: {
        SquarePaymentForm,
        PayPalButton,
        EventPaymentList
    },
    props: {
        value: Boolean,
        accountid: String
    },
    data() {
        return {
            close: mdiCloseBox,
            opened: false
        }
    },
    computed: {
        ...mapState(['driverid', 'events', 'cars', 'paymentaccounts', 'paymentitems']),
        cart() { return this.$store.getters.cart(this.accountid) },
        eventpurchases() {
            const idmap = {}
            for (const p of this.cart.purchases) {
                if (!(p.eventid in idmap)) idmap[p.eventid] = []
                idmap[p.eventid].push(p)
            }
            const ret = []
            for (const eventid in idmap) {
                ret.push({
                    event: this.events[eventid],
                    purchases: idmap[eventid]
                })
            }
            return ret
        },
        account() {
            if (!this.accountid) return {}
            return this.paymentaccounts[this.accountid] || {}
        },
        payments() {
            return this.cart.purchases.map(p => {
                const item = this.paymentitems[p.itemid]
                return {
                    driverid: this.driverid,
                    eventid: p.eventid,
                    carid: p.carid,
                    session: p.session,
                    itemname: item.name,
                    amount: item.price
                }
            })
        }
    },
    methods: {
        complete() {
            this.$store.commit('cartClear', { accountid: this.accountid })
            this.$emit('input')
        }
    }
}
</script>

<style scoped>
.itemgrid {
    display: grid;
    align-items: center;
    grid-template-columns: 1fr 4fr 1fr;
}
.eventname {
    display: block;
    font-size: 110%;
    font-weight: bold;
    border-bottom: 1px dotted gray;
}
.sum, .total {
    text-align: right;
}
.total {
    padding-top: 0.5rem;
    border-top: 1px solid lightgray;
    font-size: 150%;
}
</style>
