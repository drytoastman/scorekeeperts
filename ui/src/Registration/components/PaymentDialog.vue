<template>
    <v-row justify="center">
        <v-dialog :value="value" @input="$emit('input')" persistent max-width="450px">
            <v-card>
                <v-card-title>{{account.name}} <v-btn class='close' icon @click="$emit('input')"><v-icon>{{close}}</v-icon></v-btn></v-card-title>

                <v-card-text v-for="e in accountEvents" :key="e.eventid" class='eventwrap'>
                    <h3>{{e.name}}</h3>
                    <div v-for="r in unpaidReg(registered[e.eventid])" :key="r.eventid+r.carid" class='eventgrid'>

                        <CarLabel :car=cars[r.carid] fontsize="110%"></CarLabel>
                        <v-select :items="payitems" return-object hide-details solo dense v-model="selects[JSON.stringify(r)]"> <!-- @input="newpurchase(r, $event)"> -->
                            <template v-slot:selection="d">
                                <span class='name'>{{ d.item.name }}</span> <span class='price'>{{ d.item.price|dollars }}</span>
                            </template>
                            <template v-slot:item="d">
                                <span class='name'>{{ d.item.name }}</span> <span class='price'>{{ d.item.price|dollars }}</span>
                            </template>
                        </v-select>
                    </div>
                </v-card-text>

                <v-card-text>
                    <div class='total'>
                        Total: {{total|dollars}}
                    </div>
                </v-card-text>

                <v-card-actions>
                    <PayPalButton v-if="account.type=='paypal'"
                            :opened=value :account=account :purchase=purchase :payments=payments :total=total
                            @complete="$emit('input')">
                    </PayPalButton>
                    <SquarePaymentForm v-else
                            :opened=value :account=account :payments=payments :total=total
                            @complete="$emit('input')">
                    </SquarePaymentForm>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-row>
</template>

<script>
import _ from 'lodash'
import { mapState, mapGetters } from 'vuex'
import { mdiCloseBox } from '@mdi/js'

import { isOpen } from '@common/lib/event'
import CarLabel from '../../components/CarLabel.vue'
import SquarePaymentForm from './SquarePaymentForm'
import PayPalButton from './PayPalButton'

export default {
    components: {
        CarLabel,
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
            opened: false,
            selects: {}
        }
    },
    computed: {
        ...mapState(['events', 'registered', 'cars', 'payments', 'paymentitems', 'paymentaccounts']),
        ...mapGetters(['unpaidReg']),

        account() {
            return this.paymentaccounts[this.accountid] || {}
        },
        accountEvents() {
            return this.orderedOpenEvents.filter(e => e.accountid === this.accountid)
        },
        payitems() {
            const arr = _(this.paymentitems).values().filter(i => i.accountid === this.accountid).orderBy('name').value()
            return [{ itemid: null, name: '' }, ...arr]
        },
        orderedOpenEvents() {
            return _.orderBy(this.events, ['date']).filter(e => isOpen(e))
        },
        purchase() {
            const ret = []
            for (const key in this.selects) {
                const reg = JSON.parse(key)
                if (!this.selects[key].itemid) { continue }
                ret.push({
                    event: this.events[reg.eventid],
                    car: this.cars[reg.carid],
                    session: reg.session,
                    item: this.selects[key]
                })
            }
            return ret
        },
        total() {
            return _(this.purchase).sumBy('item.price')
        },
        payments() {
            return this.purchase.map(o => ({
                eventid: o.event.eventid,
                carid: o.car.carid,
                session: o.session,
                itemname: o.item.name,
                amount: o.item.price
            }))
        }
    },
    methods: {
    },
    watch: {
        value: async function(newv) {
            if (newv) {
                for (const i in this.selects) {
                    this.selects[i] = ''
                }
            }
        }
    }
}
</script>

<style scoped>
.eventgrid {
    display: grid;
    align-items: center;
    grid-template-columns: 3fr 4fr;
    grid-template-rows: 50px;
}
.total {
    width: 100%;
    text-align:right;
    margin-top: 2rem;
    padding-top: 0.5rem;
    padding-right: 5rem;
    border-top: 1px solid lightgray;
    font-size: 150%;
}


h3 {
    margin-top: 0.5rem;
    border-bottom: 1px solid #CCC;
}
.v-card__text {
    margin-bottom: 1rem;
}
.v-card__actions {
    padding: 0.8rem !important;
}

.container {
    background: #DDD;
    padding: 1px 10px;
}
.close {
    display: block;
    margin-left: auto;
}

.v-select__selections .name, .v-list-item .name {
    margin-right: 4px;
    font-weight: bold;
}
</style>
