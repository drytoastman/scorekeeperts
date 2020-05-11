<template>
    <v-row justify="center">
        <v-dialog :value="value" @input="$emit('input')" persistent max-width="400px">
            <v-card>
                <v-card-title>
                    <span class="headline">Payments</span>
                </v-card-title>
                <v-card-text>
                    <v-container>
                        <v-form ref="form" lazy-validation>
                            <div v-for="acct in paymentaccounts" :key="acct.accountid">
                                <div v-for="e in accountEvents(acct.accountid)" :key="e.eventid" class='eventwrap'>
                                    <h3>{{e.name}}</h3>
                                    <div v-for="r in registered[e.eventid]" :key="r.eventid+r.carid" class='eventgrid'>
                                        <CarLabel :car=cars[r.carid] fontsize="110%"></CarLabel>
                                        <div v-if="hasPayments(r.eventid, r.carid)">
                                            <span class='paidsum'>{{ paymentSum(r.eventid, r.carid)|dollars }}</span>
                                        </div>
                                        <v-select v-else :items="payitems" item-value="itemid">
                                            <template v-slot:selection="d">
                                                <span class='name'>{{ d.item.name }}</span> <span class='price'>{{ d.item.price|dollars }}</span>
                                            </template>
                                            <template v-slot:item="d">
                                                <span class='name'>{{ d.item.name }}</span> <span class='price'>{{ d.item.price|dollars }}</span>
                                            </template>
                                        </v-select>
                                    </div>
                                </div>
                                <v-btn>{{acct.type}} Payment</v-btn>
                            </div>
                        </v-form>
                    </v-container>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="$emit('input')">Cancel</v-btn>
                    <v-btn color="blue darken-1" text @click="update()">Pay</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-row>
</template>

<script>
import _ from 'lodash'
import { mapState } from 'vuex'
import CarLabel from '../../components/CarLabel'
import { EventWrap } from '@common/lib'

export default {
    components: {
        CarLabel
    },
    props: {
        value: Boolean,
        event: Object,
        reg: Array
    },
    filters: {
        dollars: function(v) {
            if (typeof v !== 'number') return typeof v
            return `$${(v / 100).toFixed(2)}`
        }
    },
    data() {
        return {
            checks: {}
        }
    },
    computed: {
        ...mapState(['events', 'registered', 'cars', 'payments', 'paymentitems', 'paymentaccounts']),
        orderedOpenEvents() { return _.orderBy(this.events, ['date']).filter(e => new EventWrap(e).isOpen()) },
        payitems() { return [{ itemid: null, name: 'No payment' }, ...this.paymentitems] }
    },
    methods: {
        accountEvents(accountid) {
            return this.orderedOpenEvents.filter(e => e.accountid === accountid)
        },
        hasPayments(eventid, carid) {
            return eventid in this.payments ? this.payments[eventid][carid] : false
        },
        paymentSum(eventid, carid) {
            return _.sumBy(this.payments[eventid][carid], 'amount')
        },
        itemText(item) {
            return `${item.name} - ${item.price}`
        },
        update() {
            // Create new reg objects and send request
            // this.$store.dispatch('setdata', {
            this.$emit('input')
        }
    },
    watch: {
        value: function(newv) {
            if (newv) {
                // on open
            }
        }
    }
}
</script>

<style scoped>
.eventgrid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
}
.v-input {
    padding: 0;
}
.price {
    margin-left: 10px;
}
.paidsum {
    font-style: italic;
    color: gray;
}
h3 {
    margin-top: 1rem;
}
.eventwrap:first-child h3 {
    margin-top: 0;
}
</style>
