<template>
    <v-dialog :value="value" @input="$emit('input')" persistent max-width="600px">
        <v-card>
            <v-card-title>
                <span class="headline secondary--text text--darken-2">Refund Payment Items</span>
            </v-card-title>
            <v-card-text>
                <v-data-table :items="txpayments" :headers="headers" item-key="payid" v-model="selected" disable-pagination hide-default-footer show-select>
                    <template v-slot:item.amount="{ item }">
                        {{item.amount | dollars}}
                    </template>
                    <template v-slot:item.eventid="{ item }">
                        {{events[item.eventid].name}}
                    </template>
                </v-data-table>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="secondary darken-2" text @click="$emit('input')">Cancel</v-btn>
                <v-btn color="secondary darken-2" text @click="mark"   :loading="inflight" :disabled="inflight">Mark Refunded</v-btn>
                <v-btn color="secondary darken-2" text @click="update" :loading="inflight" :disabled="inflight"
                       v-if="base.accountid && base.txtype==='square'">{{actionbutton}}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import _ from 'lodash'
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
            selected: [],
            inflight: false
        }
    },
    computed: {
        ...mapState(['events', 'payments']),
        txpayments() { return _(this.payments).map(v => v).flatten().filter({ txid: this.base.txid, refunded: false }).value() },
        actionbutton() { return `Square Refund ${this.$options.filters.dollars(_(this.selected).sumBy('amount'))}` }
    },
    methods: {
        update() {
            this.inflight = true
            /*
            this.$store.dispatch('setdata', {
                type: this.apiType,
                items: { indexes: [this.indexm] },
                busy: { key: 'busyIndex', id: this.indexm.indexcode }
            }) */
            this.inflight = false
            this.$emit('input')
        },
        mark() {
            this.selected.forEach(p => { p.refunded = true })
            this.$store.dispatch('setdata', {
                type: 'update',
                items: { payments: this.selected },
                busy: { key: 'busyIndex', id: this.selected.map(p => p.payid) }
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
