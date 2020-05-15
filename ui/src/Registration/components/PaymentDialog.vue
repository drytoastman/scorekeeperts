<template>
    <v-row justify="center">
        <v-dialog :value="value" @input="$emit('input')" persistent max-width="450px">
            <v-container>
                <v-btn class='close' icon @click="$emit('input')"><v-icon>{{close}}</v-icon></v-btn>
                <v-card>
                    <v-card-title>{{account.name}}</v-card-title>

                    <v-card-text v-for="e in accountEvents" :key="e.eventid" class='eventwrap'>
                        <h3>{{e.name}}</h3>
                        <div v-for="r in unpaidReg(registered[e.eventid])" :key="r.eventid+r.carid" class='eventgrid'>

                            <CarLabel :car=cars[r.carid] fontsize="110%"></CarLabel>
                            <v-select :items="payitems" item-value="itemid" return-object hide-details solo dense
                                @input="newpurchase(r, $event)"
                            >
                                <template v-slot:selection="d">
                                    <span class='name'>{{ d.item.name }}</span> <span class='price'>{{ d.item.price|dollars }}</span>
                                </template>
                                <template v-slot:item="d">
                                    <span class='name'>{{ d.item.name }}</span> <span class='price'>{{ d.item.price|dollars }}</span>
                                </template>
                            </v-select>

                        </div>
                    </v-card-text>

                    <v-card-actions class='d-flex'>
                        <div v-if="account.type=='paypal'" id="paypal-button-container" :class="total > 0 ? '' : 'disabled'"></div>

                        <v-btn v-else color=secondary :disabled="!(total>0)">{{account.type}} Payment {{total|dollars}}</v-btn>

                    </v-card-actions>
                </v-card>

            </v-container>
        </v-dialog>
    </v-row>
</template>

<script>
import _ from 'lodash'
import { mapState, mapGetters } from 'vuex'
import { mdiCloseBox } from '@mdi/js'

import CarLabel from '../../components/CarLabel.vue'
import { loadPaypal, unloadPaypal, buildPaypalOrder } from '../paypal'
import { EventWrap } from '@common/lib'

export default {
    components: {
        CarLabel
    },
    props: {
        value: Boolean,
        accountid: String
    },
    data() {
        return {
            close: mdiCloseBox,
            purchase: {},
            total: {},
            paypalStyle: {
                layout: 'horizontal',
                tagline: false,
                height: 35
            }
        }
    },
    computed: {
        ...mapState(['series', 'events', 'registered', 'cars', 'payments', 'paymentitems', 'paymentaccounts']),
        ...mapGetters(['unpaidReg']),

        account() {
            return this.paymentaccounts[this.accountid] || {}
        },
        accountEvents() {
            return this.orderedOpenEvents.filter(e => e.accountid === this.accountid)
        },
        payitems() {
            return [{ itemid: null, name: '' }, ...this.paymentitems.filter(i => i.accountid === this.accountid)]
        },
        orderedOpenEvents() {
            return _.orderBy(this.events, ['date']).filter(e => new EventWrap(e).isOpen())
        }
    },
    methods: {
        newpurchase(reg, value) {
            this.purchase[reg.eventid + reg.carid + reg.session] = {
                event: this.events[reg.eventid],
                car: this.cars[reg.carid],
                session: reg.session,
                item: value
            }
            this.total = _(this.purchase).values().sumBy('item.price')
        },

        createPayments() {
            return _(this.purchase).values().map(o => ({
                eventid: o.event.eventid,
                carid: o.car.carid,
                session: o.session,
                itemname: o.item.name,
                amount: o.item.price
            })).value()
        },

        createPaypalOrder() {
            // calls out to here to get purchases and then back into paypal library
            return buildPaypalOrder(Object.values(this.purchase))
        },
        paypalApproved(data) {
            this.$store.dispatch('setdata', {
                series: this.series,
                type: 'insert',
                paypal: { orderid: data.orderID, accountid: this.accountid },
                payments: this.createPayments(),
                busy: { key: 'busyPay', ids: this.accountEvents.map(e => e.eventid) }
            })
            this.$emit('input')
        }
    },
    watch: {
        value: async function(newv) {
            if (newv) {
                if (this.account.type === 'paypal') {
                    loadPaypal(this.accountid, this.paypalStyle, '#paypal-button-container', this.createPaypalOrder, this.paypalApproved)
                }
            } else {
                if (this.account.type === 'paypal') {
                    unloadPaypal(this.accountid)
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
.paidsum {
    font-style: italic;
    color: gray;
}

h3 {
    margin-top: 0.5rem;
    border-bottom: 1px solid #CCC;
}
.v-card__text {
    margin-bottom: 1rem;
}
.v-card__actions * {
    flex-grow: 1;
    margin: 5px 10px !important;
}

.container {
    background: #DDD;
    padding: 1px 10px;
}
.close {
    display: block;
    margin-left: auto;
}
.v-card {
    margin-bottom: 1rem;
}

.v-select__selections .name, .v-list-item .name {
    margin-right: 4px;
    font-weight: bold;
}

#paypal-button-container.disabled {
    pointer-events: none;
    opacity: 0.4;
}

</style>
