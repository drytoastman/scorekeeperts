<template>
    <v-row justify="center">
        <v-dialog :value="value" @input="$emit('input')" persistent max-width="450px">
            <v-card>
                <v-card-title>{{account.name}} <v-btn class='close' icon @click="$emit('input')"><v-icon>{{close}}</v-icon></v-btn></v-card-title>

                <v-card-text class='itemgrixxxd'>
                    <div v-for="eventdata in eventpurchases" :key="eventdata.name">
                        <span class='eventname'>{{eventdata.name}}</span>
                        <div v-for="(p, ii) in eventdata.payments" :key="p.itemid+ii" class='itemgrid'>
                            <span v-if="p.carid">{{p.session || cars[p.carid].classcode}}</span>
                            <span v-else></span>
                            <span>{{paymentitems[p.itemid].name}}</span>
                            <span class='sum'>{{p.sum|cents2dollars}}</span>
                        </div>
                    </div>
                </v-card-text>

                <v-card-text>
                    <div class='total'>
                        {{cart.total|cents2dollars}}
                    </div>
                </v-card-text>

                <v-card-actions>
                    <div v-if="!devMode">
                        Version 2 payments disabled for now
                    </div>
                    <PayPalButton v-else-if="account.type=='paypal'"
                            :opened=value :account=account :payments=payments :total=cart.total @complete=complete :purchase=cart.purchases>
                    </PayPalButton>
                    <SquarePaymentForm v-else
                            :opened=value :account=account :payments=payments :total=cart.total @complete=complete>
                    </SquarePaymentForm>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-row>
</template>

<script>
import { mapState } from 'vuex'
import { mdiCloseBox } from '@mdi/js'
import SquarePaymentForm from './SquarePaymentForm.vue'
import PayPalButton from './PayPalButton.vue'

export default {
    components: {
        SquarePaymentForm,
        PayPalButton
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
                    name: this.events[eventid].name,
                    payments: idmap[eventid]
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
        },
        devMode() { return process.env.NODE_ENV === 'development' }
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
    margin-top: 2rem;
    padding-top: 0.5rem;
    border-top: 1px solid lightgray;
    font-size: 150%;
}
</style>
