<template>
    <v-dialog :value="value" @input="$emit('input')" persistent max-width="600px">
        <v-card>
            <v-card-title>
                <span class="headline primary--text">Refund Payment Items</span>
            </v-card-title>
            <v-card-text>
                <v-data-table :items="txpayments" :headers="headers" item-key="payid" v-model="selected"
                                disable-pagination disable-sort hide-default-footer show-select>
                    <template v-slot:[`item.amount`]="{ item }">
                        {{item.amount | cents2dollars}}
                    </template>
                    <template v-slot:[`item.eventid`]="{ item }">
                        {{events[item.eventid].name}}
                    </template>
                </v-data-table>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary darken-2" text @click="$emit('input')">Cancel</v-btn>
                <v-btn color="primary darken-2" text @click="mark">Mark Refunded</v-btn>
                <v-btn color="primary darken-2" text @click="refund" v-if="base.accountid && base.txtype==='square'">{{actionbutton}}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import filter from 'lodash/filter'
import flatten from 'lodash/flatten'
import cloneDeep from 'lodash/cloneDeep'
import sumBy from 'lodash/sumBy'
import { mapState } from 'vuex'

export default {
    props: {
        value: Boolean,
        base: Object
    },
    data() {
        return {
            headers: [
                { text: 'First',   value: 'firstname' },
                { text: 'Last',    value: 'lastname' },
                { text: 'Event',   value: 'eventid' },
                { text: 'Item',    value: 'itemname' },
                { text: 'Amount',  value: 'amount' }
            ],
            selected: []
        }
    },
    computed: {
        ...mapState(['drivers', 'cars', 'events', 'payments']),
        txpayments() {
            const payments = (!this.base.txid) ? [this.base] : filter(flatten(Object.values(this.payments)), { txid: this.base.txid, refunded: false })
            return payments.map(p => {
                const d = this.drivers[p.driverid || this.cars[p.carid]?.driverid]
                return {
                    ...p,
                    firstname: d?.firstname,
                    lastname: d?.lastname
                }
            })
        },
        actionbutton() { return `Square Refund ${this.$options.filters.cents2dollars(sumBy(this.selected, 'amount'))}` }
    },
    methods: {
        refund() {
            this.$store.dispatch('setdata', {
                type: 'update',
                items: { refund: this.selected },
                busy: { key: 'busyPayment', id: this.selected.map(p => p.payid) }
            })
            this.$emit('input')
        },
        mark() {
            const toupdate = cloneDeep(this.selected)
            toupdate.forEach(p => { p.refunded = true })
            this.$store.dispatch('setdata', {
                type: 'update',
                items: { payments: toupdate },
                busy: { key: 'busyPayment', id: toupdate.map(p => p.payid) }
            })
            this.$emit('input')
        }
    },
    watch: {
        value: function(newv) {
            if (newv) {
                this.selected = []
            }
        }
    }
}
</script>

<style scoped>
</style>
