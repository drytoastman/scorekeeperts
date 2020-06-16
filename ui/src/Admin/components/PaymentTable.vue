<template>
    <div class='paymenttable'>
        <v-data-table :items="paymentlist" :headers="headers" item-key="indexcode" disable-pagination hide-default-footer>
            <template v-slot:item.amount="{ item }">
                <span v-if="item.refunded">
                    Refunded
                </span>
                <span v-else>
                    {{item.amount | dollars}}
                </span>
            </template>

            <template v-slot:item.actions="{ item }">
                <div v-if="item.refunded">
                </div>
                <div v-else-if="busyPayment[item.txid]" class='busy'>
                    busy
                </div>
                <div v-else class='buttongrid'>
                    <v-icon v-if="item.accountid && item.txtype==='square'" @click.stop="refund(item)">{{icons.mdiCreditCardRemove}}</v-icon>
                    <v-icon v-else @click.stop="refund(item)">{{icons.mdiDelete}}</v-icon>
                </div>
            </template>
        </v-data-table>

        <RefundDialog :base="dialogData" v-model="RefundDialog"></RefundDialog>
    </div>
</template>

<script>
import _ from 'lodash'
import { mapState } from 'vuex'
import { mdiCreditCardRemove, mdiDelete } from '@mdi/js'
import RefundDialog from './RefundDialog'

export default {
    name: 'PaymentTable',
    components: {
        RefundDialog
    },
    props: {
        eventid: String
    },
    data() {
        return {
            dialogData: { attr:{} },
            RefundDialog: false,
            icons: {
                mdiCreditCardRemove,
                mdiDelete
            },
            headers: [
                { text: 'First',   value: 'firstname' },
                { text: 'Last',    value: 'lastname' },
                { text: 'Item',    value: 'itemname' },
                { text: 'Type',    value: 'txtype' },
                { text: 'Amount',  value: 'amount' },
                { text: 'Refund',  value: 'actions', sortable: false }
            ]
        }
    },
    computed: {
        ...mapState(['payments', 'busyPayment']),
        paymentlist() { return this.payments[this.eventid] }
    },
    methods: {
        refund(item) {
            this.dialogData = item
            this.RefundDialog = true
        }
    },
    mounted() {
        if (_.isEmpty(this.$store.state.payments)) {
            this.$store.dispatch('getdata', { items: 'payments' })
        }
        if (_.isEmpty(this.$store.state.registered)) {
            this.$store.dispatch('getdata', { items: 'registered' })
        }
    }
}
</script>

<style lang='scss'>
.paymenttable {
    .v-data-table td, .v-data-table th {
        padding: 0 4px;
    }
    .v-data-table__wrapper {
        overflow-x: hidden;
    }
}
</style>

<style scoped>
.buttongrid {
    display: grid;
    grid-template-columns: 25px 25px;
}
.paymenttable {
    margin: 1rem;
}
.v-btn {
    margin-right: 1rem;
}
.busy {
    color: #F44;
}
</style>
