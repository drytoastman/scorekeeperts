<template>
    <div class='entranttable'>
        <v-data-table :items="entrantlist" :headers="headers" :search="search" :custom-filter="itemFilter"
                        :footer-props="{itemsPerPageOptions: [10,20,35,-1]}" :items-per-page.sync="$store.state.itemsPerPage"
                        :sort-by="['lastname']" multi-sort dense>
            <template v-slot:top>
                <div class='topgrid'>
                <div v-if="eventid" class='left'>
                    <h2>Entries</h2>
                </div>
                <div v-else class='left'>
                    <h2>Series Payments</h2>
                </div>
                <v-text-field class='right' v-model="search" :append-icon="icons.mdiMagnify" single-line hide-details label="Search">
                </v-text-field>
                </div>
            </template>

            <template v-slot:[`item.car`]="{ item }"><CarLabel :car=item.car></CarLabel></template>
            <template v-slot:[`item.payment`]="{ item }"><PaymentLabel :payment=item.payment></PaymentLabel></template>

            <template v-slot:[`item.actions`]="{ item }">
                <div v-if='!item.busy && !busyPayment[item.payment && item.payment.payid]'>
                    <v-icon v-if="item.payment && !item.payment.refunded" @click.stop="refund(item)">{{icons.mdiCreditCardRefund}}</v-icon>

                    <v-icon v-if="doRunEdit" @click.stop="editruns(item)">{{icons.mdiCarSettings}}</v-icon>
                    <v-icon v-else-if="eventid && (!item.payment || item.payment.refunded)" @click.stop="unregister(item)">{{icons.mdiAccountRemove}}</v-icon>
                </div>
                <div v-else>
                    busy
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
import { carMatch } from '@/common/car'
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
            dialogData: { attr: {}},
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
        event() {
            return this.eventid in this.events ? this.events[this.eventid] : {}
        },
        doRunEdit() {
            return hasFinished(this.event)
        },
        entrantlist() {
            if (this.eventid) { // use registration, add payments
                if (isEmpty(this.registered) || isEmpty(this.payments)) {
                    return [] // no data yet
                }
                return this.registered[this.eventid].map(r => {
                    const c = this.cars[r.carid]
                    const d = this.drivers[c?.driverid]
                    return {
                        firstname: d?.firstname,
                        lastname: d?.lastname,
                        eventname: '',
                        session: r.session,
                        car: c,
                        payment: this.payments[this.eventid].find(p => p.carid === r.carid) || null,
                        busy: false
                    }
                })
            } else { // use payments
                return flatten(Object.values(this.payments)).map(p => {
                    const c = this.cars[p.carid]
                    const d = this.drivers[c?.driverid]
                    const e = this.events[p.eventid]
                    return {
                        firstname: d?.firstname,
                        lastname: d?.lastname,
                        eventname: e?.name,
                        car: c,
                        payment: p,
                        busy: false
                    }
                })
            }
        },
        headers() {
            const headers = [
                { text: 'First',   value: 'firstname' },
                { text: 'Last',    value: 'lastname' },
                { text: 'Event',   value: 'eventname' },
                { text: 'Session', value: 'session' },
                { text: 'Car',     value: 'car',     sortable: false },
                { text: 'Payment', value: 'payment', sortable: false },
                { text: 'Actions', value: 'actions', sortable: false }
            ]
            if (this.eventid) {
                headers.splice(2, 1) // remove event column when looking at a single event
            } else {
                headers.splice(3, 2) // otherwise remove the session/car
            }
            return headers
        }
    },
    methods: {
        refund(item) {
            this.dialogData = item.payment
            this.RefundDialog = true
        },
        editruns(item) {
            console.log(item)
        },
        unregister(item) {
            item.busy = true
            this.$store.dispatch('setdata', {
                type: 'delete',
                items: {
                    registered: [{
                        carid: item.car.carid,
                        eventid: this.eventid,
                        session: item.session
                    }]
                }
            }).finally(() => { item.busy = false })
        },
        itemFilter(value, search, item) {
            if (!search) return true
            const r = new RegExp(search, 'i')
            return (
                r.test(item.firstname) || r.test(item.lastname) || r.test(item.eventname) || r.test(item.session) ||
                carMatch(item.car, r) || (item.payment && (item.payment.refunded ? r.test('Refunded') : r.test(item.payment.itemname)))
            )
        }
    },
    async mounted() {
        this.$store.dispatch('ensureTablesAndCarDriverInfo', ['payments', 'registered'])
    }
}
</script>

<style lang='scss'>
.entranttable {
    margin: 1rem;
    .v-btn {
        margin-right: 1rem;
    }
    .busy {
        color: #F44;
    }
    .v-text-field {
        padding-top: 0;
    }

    .v-data-table td, .v-data-table th {
        padding: 0 4px;
    }
    .v-data-table__wrapper {
        overflow-x: hidden;
    }
    .topgrid {
        display: grid;
        grid-template-columns: 2fr 3fr;
        align-items: baseline;
        margin-bottom: 1rem;
    }
    .right {
        width: 100%;
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
