<template>
    <v-row justify="center">
        <v-dialog :value="value" @input="$emit('input')" persistent max-width="450px">
            <v-container>
                <v-btn class='close' icon @click="$emit('input')"><v-icon>{{close}}</v-icon></v-btn>

                <v-card v-for="acct in paymentaccounts" :key="acct.accountid">
                    <v-card-title>{{acct.name}}</v-card-title>

                    <v-card-text v-for="e in accountEvents(acct.accountid)" :key="e.eventid" class='eventwrap'>
                        <h3>{{e.name}}</h3>
                        <div v-for="r in unpaidReg(registered[e.eventid])" :key="r.eventid+r.carid" class='eventgrid'>

                            <CarLabel :car=cars[r.carid] fontsize="110%"></CarLabel>
                            <v-select :items="payitems(acct.accountid)" item-value="itemid" return-object hide-details solo dense
                                @input="newpurchase(acct.accountid, r, $event)"
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
                        <div v-if="acct.type=='paypal'" id="paypal-button-container" :class="total[acct.accountid] > 0 ? '' : 'disabled'"></div>

                        <v-btn v-else color=secondary :disabled="!(total[acct.accountid]>0)">{{acct.type}} Payment {{total[acct.accountid]|dollars}}</v-btn>

                    </v-card-actions>
                </v-card>

            </v-container>
        </v-dialog>
    </v-row>
</template>

<script>
import Vue from 'vue'
import _ from 'lodash'
import { mapState } from 'vuex'
import { mdiCloseBox } from '@mdi/js'

import CarLabel from '../../components/CarLabel.vue'
import { loadPaypal, unloadPaypal, buildPaypalOrder } from '../paypal'
import { EventWrap } from '@common/lib'

export default {
    components: {
        CarLabel
    },
    props: {
        value: Boolean
    },
    filters: {
        dollars: function(v) {
            if (typeof v !== 'number') return ''
            return `$${(v / 100).toFixed(2)}`
        }
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
        orderedOpenEvents() {
            return _.orderBy(this.events, ['date']).filter(e => new EventWrap(e).isOpen())
        },
        firstPaypalClientId() {
            const usedAccounts = _.orderBy(this.events, ['date']).map(e => e.accountid)
            const usedPaypal   = this.paymentaccounts.filter(p => usedAccounts.includes(p.accountid) && p.type === 'paypal')
            if (usedPaypal.length > 1) {
                console.error("More than one active paypal account for the series, this won't work due to Paypal client global variable")
            }
            if (usedPaypal.length > 0) {
                return usedPaypal[0].accountid
            }
            return null
        }
    },
    methods: {
        payitems(accountid) {
            return [{ itemid: null, name: '' }, ...this.paymentitems.filter(i => i.accountid === accountid)]
        },
        accountEvents(accountid) {
            return this.orderedOpenEvents.filter(e => e.accountid === accountid)
        },
        hasPayments(eventid, carid) {
            return eventid in this.payments ? this.payments[eventid][carid] : false
        },
        paymentSum(eventid, carid) {
            return _.sumBy(this.payments[eventid][carid], 'amount')
        },
        unpaidReg(reglist) {
            return reglist.filter(r => !this.hasPayments(r.eventid, r.carid))
        },
        newpurchase(accountid, reg, value) {
            if (!(accountid in this.purchase)) {
                this.purchase[accountid] = {}
            }
            this.purchase[accountid][reg.eventid + reg.carid + reg.session] = {
                event: this.events[reg.eventid],
                car: this.cars[reg.carid],
                session: reg.session,
                item: value
            }
            Vue.set(this.total, accountid, _(this.purchase[accountid]).values().sumBy('item.price'))
        },

        createPayments(accountid) {
            return _(this.purchase[accountid]).values().map(o => ({
                eventid: o.event.eventid,
                carid: o.car.carid,
                session: o.session,
                name: o.item.name,
                amount: o.item.price
            })).value()
        },

        createPaypalOrder() {
            return buildPaypalOrder(Object.values(this.purchase[this.firstPaypalClientId]))
        },
        paypalApproved(data) {
            this.$store.dispatch('setdata', {
                series: this.series,
                type: 'paypal',
                orderid: data.orderID,
                paypal: this.createPayments(this.firstPaypalClientId),
                busy: { key: 'busyReg', ids: this.accountEvents(this.firstPaypalClientId).map(e => e.eventid) }
            })
            this.$emit('input')
        }
    },
    watch: {
        value: async function(newv) {
            if (newv) {
                if (this.firstPaypalClientId) {
                    loadPaypal(this.firstPaypalClientId, this.paypalStyle, '#paypal-button-container', this.createPaypalOrder, this.paypalApproved)
                }
            } else {
                if (this.firstPaypalClientId) {
                    unloadPaypal(this.firstPaypalClientId)
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
