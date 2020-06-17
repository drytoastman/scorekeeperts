<template>
    <div class='paymenttable'>
        <v-data-table :items="paymentlist" :headers="headers" item-key="indexcode" :sort-by="['lastname', 'firstname']"
                        disable-pagination hide-default-footer multi-sort>
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
                <div v-else-if="busyPayment[item.payid]" class='busy'>
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
        if (_.isEmpty(this.$store.state.payments)) {
            req.push(this.$store.dispatch('getdata', { items: 'payments' }))
        }
        if (_.isEmpty(this.$store.state.registered)) {
            req.push(this.$store.dispatch('getdata', { items: 'registered' }))
        }

        await Promise.all(req)

        const carids = new Set(
            _(this.payments).values().flatten().map(p => p.carid).value(),
            _(this.registered).values().flatten().map(r => r.carid).value())
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
