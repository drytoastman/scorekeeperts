<template>
    <div class='entranttable'>
        <v-data-table :items="entrantlist" :headers="headers" :search="search" item-key="indexcode" :sort-by="['lastname', 'firstname']"
                        disable-pagination hide-default-footer multi-sort>
            <template v-slot:top>
                <div class='topgrid'>
                <div v-if="eventid" class='left'>
                    <h2>{{events[eventid].name}} Entries</h2>
                </div>
                <div v-else class='left'>
                    <h2>Series Payments</h2>
                </div>
                <v-text-field class='right' v-model="search" :append-icon="icons.mdiMagnify" label="Search" single-line hide-details></v-text-field>
                </div>
            </template>

            <template v-slot:item.firstname="{ item }">{{item.driver && item.driver.firstname}}</template>
            <template v-slot:item.lastname="{ item }"> {{item.driver && item.driver.lastname}}</template>
            <template v-slot:item.eventid="{ item }">  {{events[item.eventid].name}}</template>
            <template v-slot:item.carid="{ item }">    <CarLabel :car="cars[item.carid]"></CarLabel></template>
            <template v-slot:item.payment="{ item }">  <PaymentLabel :payment=item.payment></PaymentLabel></template>

            <template v-slot:item.actions="{ item }">
                <div v-if="item.refunded">
                </div>
                <div v-else-if="busyPayment[item.payid]" class='busy'>
                    busy
                </div>
                <div v-else class='buttongrid'>
                    <v-icon @click.stop="refund(item)">{{icons.mdiCreditCardRefund}}</v-icon>
                    <v-icon v-if="doRunEdit" @click.stop="refund(item)">{{icons.mdiCarSettings}}</v-icon>
                    <v-icon v-else @click.stop="refund(item)">{{icons.mdiAccountRemove}}</v-icon>
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
import { mdiCreditCardRefund, mdiDelete, mdiMagnify, mdiAccountRemove, mdiCarSettings } from '@mdi/js'
import { hasFinished } from '@/common/event'
import RefundDialog from './RefundDialog'
import CarLabel from '../../components/CarLabel'
import PaymentLabel from './PaymentLabel'

export default {
    name: 'entranttable',
    components: {
        RefundDialog,
        CarLabel,
        PaymentLabel
    },
    props: {
        eventid: String,
        showPayments: Boolean
    },
    data() {
        return {
            dialogData: { attr:{} },
            RefundDialog: false,
            icons: {
                mdiCreditCardRefund,
                mdiDelete,
                mdiMagnify,
                mdiAccountRemove,
                mdiCarSettings
            },
            search: ''
        }
    },
    computed: {
        ...mapState(['drivers', 'cars', 'events', 'payments', 'registered', 'busyPayment']),
        doRunEdit() {
            return this.eventid && hasFinished(this.events[this.eventid])
        },
        entrantlist() {
            if (this.eventid) { // use registration, add payments
                if (isEmpty(this.registered)) {
                    return [] // no data yet
                }
                return this.registered[this.eventid].map(r => {
                    const c = this.cars[r.carid]
                    return {
                        driver: this.drivers[c?.driverid],
                        carid: r.carid,
                        registration: r,
                        payment: this.payments[this.eventid].find(p => p.carid === r.carid)
                    }
                })
            } else { // use payments
                return flatten(Object.values(this.payments)).map(p => ({
                    driver: this.drivers[this.cars[p.carid]?.driverid],
                    carid: p.carid,
                    eventid: p.eventid,
                    payment: p
                }))
            }
        },
        headers() {
            const headers = [
                { text: 'First',   value: 'firstname' },
                { text: 'Last',    value: 'lastname' },
                { text: 'Event',   value: 'eventid' },
                { text: 'Car',     value: 'carid' },
                { text: 'Payment', value: 'payment' },
                { text: 'Actions',  value: 'actions', sortable: false }
            ]
            if (this.eventid) {
                headers.splice(2, 1) // remove event column when looking at a single event
            } else {
                headers.splice(3, 1) // otherwise remove the car
            }
            return headers
        }
    },
    methods: {
        refund(item) {
            this.dialogData = item.payment
            this.RefundDialog = true
        }
    },
    async mounted() {
        const req = []
        if (isEmpty(this.payments)) {
            req.push(this.$store.dispatch('getdata', { items: 'payments' }))
        }
        if (isEmpty(this.registered)) {
            req.push(this.$store.dispatch('getdata', { items: 'registered' }))
        }

        await Promise.all(req)

        const carids = new Set([
            ...flatten(Object.values(this.payments)).map(p => p.carid),
            ...flatten(Object.values(this.registered)).map(r => r.carid)])
        this.$store.dispatch('ensureCarDriverInfo', carids)
    }
}
</script>

<style lang='scss'>
.entranttable {
    margin: 1rem;
    .buttongrid {
        display: grid;
        grid-template-columns: 25px 25px;
    }
    .v-btn {
        margin-right: 1rem;
    }
    .busy {
        color: #F44;
    }

    .v-data-table td, .v-data-table th {
        padding: 0 4px;
    }
    .v-data-table__wrapper {
        overflow-x: hidden;
    }
    th {
        min-width: 100px;
    }
    td {
        padding: 0 7px !important;
    }
    .topgrid {
        display: grid;
        grid-template-columns: 1fr 2fr;
        align-items: baseline;
        margin-bottom: 1rem;
    }

    @media (max-width: 700px) {
        .topgrid {
            display: initial;
        }
        .right {
            padding-top: 0;
            margin-bottom: 1rem;
        }
    }
}
</style>
