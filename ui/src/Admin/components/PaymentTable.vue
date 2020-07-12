<template>
    <div class='paymenttable'>
        <v-data-table :items="paymentlist" :headers="headers" item-key="indexcode" :sort-by="['lastname', 'firstname']"
                        disable-pagination hide-default-footer multi-sort>
            <template v-slot:item.amount="{ item }">
                <span v-if="item.refunded">
                    Refunded
                </span>
                <span v-else>
                    {{item.amount | cents2dollars}}
                </span>
            </template>

            <template v-slot:item.actions="{ item }">
                <div v-if="item.refunded">
                </div>
                <div v-else-if="busyPayment[item.payid]" class='busy'>
                    busy
                </div>
                <div v-else class='buttongrid'>
                    <v-icon v-if="item.accountid && item.txtype==='square'" @click.stop="refund(item)">{{icons.mdiCreditCardRefund}}</v-icon>
                    <v-icon v-else @click.stop="refund(item)">{{icons.mdiCreditCardRefund}}</v-icon>
                </div>
            </template>
        </v-data-table>

        <RefundDialog :base="dialogData" v-model="RefundDialog"></RefundDialog>
    </div>
</template>

<script>
import isEmpty from 'lodash/isEmpty'
import flatten from 'lodash/flatten'
import { mapState } from 'vuex'
import { mdiCreditCardRefund, mdiDelete } from '@mdi/js'
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
                mdiCreditCardRefund,
                mdiDelete
            },
            headers: [
                { text: 'First',   value: 'firstname' },
                { text: 'Last',    value: 'lastname' },
                { text: 'Item',    value: 'itemname' },
                { text: 'Type',    value: 'txtype' },
                { text: 'Amount',  value: 'amount' },
                { text: 'Mark/Refund',  value: 'actions', sortable: false }
            ]
        }
    },
    computed: {
        ...mapState(['drivers', 'cars', 'payments', 'registered', 'busyPayment']),
        paymentlist() {
            if (!(this.eventid in this.payments)) { return [] }
            return this.payments[this.eventid].map(p => {
                const d = this.drivers[this.cars[p.carid]?.driverid]
                return {
                    ...p,
                    firstname: d?.firstname,
                    lastname: d?.lastname
                }
            })
        }
    },
    methods: {
        refund(item) {
            this.dialogData = item
            this.RefundDialog = true
        }
    },
    async mounted() {
        const req = []
        if (isEmpty(this.$store.state.payments)) {
            req.push(this.$store.dispatch('getdata', { items: 'payments' }))
        }
        if (isEmpty(this.$store.state.registered)) {
            req.push(this.$store.dispatch('getdata', { items: 'registered' }))
        }

        await Promise.all(req)

        const carids = new Set(
            flatten(Object.values(this.payments)).map(p => p.carid),
            this.registered[this.eventid].map(r => r.carid))
        this.$store.dispatch('ensureCarDriverInfo', carids)
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
