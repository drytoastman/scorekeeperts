<template>
    <div class='paymenttable'>

        <v-data-table :items="paymentlist" :headers="headers" item-key="indexcode" disable-pagination hide-default-footer>
            <template v-slot:item.amount="{ item }">
                {{item.amount | dollars}}
            </template>

            <template v-slot:item.actions="{ item }">
                <div v-if="busyPayment[item.txid]" class='busy'>
                    busy
                </div>
                <div v-else-if="item.attr.accountid && item.txtype==='square'" class='buttongrid'>
                    <v-icon @click.stop="refund(item)">{{icons.mdiCreditCardRemove}}</v-icon>
                </div>
            </template>
        </v-data-table>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import { mdiCreditCardRemove } from '@mdi/js'

export default {
    name: 'PaymentTable',
    components: {
    },
    props: {
        eventid: String
    },
    data() {
        return {
            icons: {
                mdiCreditCardRemove
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
            console.log(`refund ${JSON.stringify(item)}`)
        }
    },
    mounted() {
        console.log(`payments ${this.eventid}`)
        this.$store.dispatch('getdata', { eventid: this.eventid, items: 'payments' })
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
