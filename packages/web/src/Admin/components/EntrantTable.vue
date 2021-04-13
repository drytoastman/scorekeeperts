<template>
    <div class='entranttable'>
        <v-data-table :items="entrantlist" :headers="headers" :search="search" :custom-filter="itemFilter"
                        :footer-props="{itemsPerPageOptions: [10,20,30,-1]}" :items-per-page.sync="$store.state.itemsPerPage"
                        :sort-by="['lastname']" multi-sort dense>
            <template v-slot:top>
                <div class='topgrid'>
                <div class='title'>{{title}}</div>
                <v-text-field class='right' v-model="search" :append-icon="icons.mdiMagnify" single-line hide-details label="Regex Search">
                </v-text-field>
                </div>
            </template>

            <template v-slot:[`item.car`]="{ item }"><CarLabel :car=item.car></CarLabel></template>
            <template v-slot:[`item.payment`]="{ item }"><PaymentLabel :payment=item.payment></PaymentLabel></template>

            <template v-slot:[`item.actions`]="{ item }">
                <div v-if='!item.busy && !busyPayment[item.payment && item.payment.payid]'>
                    <v-icon v-if="item.payment && item.payment.txid && !item.payment.refunded" @click.stop="refund(item)">{{icons.mdiCreditCardRefund}}</v-icon>

                    <v-icon v-if="doRunEdit" @click.stop="editruns(item)">{{icons.mdiCarSettings}}</v-icon>
                    <v-icon v-else-if="eventid && (!item.payment || item.payment.refunded)" @click.stop="unregister(item)">{{icons.mdiAccountRemove}}</v-icon>
                </div>
                <div v-else>
                    busy
                </div>
            </template>
        </v-data-table>

        <RefundDialog :base="dialogData" v-model="RefundDialog"></RefundDialog>
        <RunEditDialog :data="dialogData" v-model="RunEditDialog"></RunEditDialog>
    </div>
</template>

<script>
import flatten from 'lodash/flatten'
import { mapState } from 'vuex'
import { mdiCreditCardRefund, mdiDelete, mdiMagnify, mdiAccountRemove, mdiCarSettings } from '@mdi/js'
import { hasFinished } from 'sctypes/event'
import { carMatch } from 'sctypes/car'
import RefundDialog from './RefundDialog.vue'
import RunEditDialog from './RunEditDialog.vue'
import CarLabel from '../../components/CarLabel.vue'
import PaymentLabel from './PaymentLabel.vue'

export default {
    name: 'EntrantTable',
    components: {
        RefundDialog,
        CarLabel,
        PaymentLabel,
        RunEditDialog
    },
    props: {
        eventid: String,
        type: String
    },
    data() {
        return {
            dialogData: {},
            RefundDialog: false,
            RunEditDialog: false,
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
        ...mapState(['currentSeries', 'drivers', 'cars', 'events', 'payments', 'registered', 'busyPayment']),
        event() {
            return this.events[this.eventid] || {}
        },
        doRunEdit() {
            return this.event.date && hasFinished(this.event)
        },
        entrantlist() {
            if (this.eventid) { // use registration, add payments
                if (!this.registered[this.eventid]) {
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
                        payment: (this.payments[this.eventid] || []).find(p => p.carid === r.carid && p.session === r.session && !p.refunded) || null,
                        busy: false
                    }
                })
            } else { // use payments
                const payments = flatten(Object.values(this.payments)).filter(p => (this.type === 'membership') ? !p.eventid : !!p.eventid)
                return payments.map(p => {
                    const c = this.cars[p.carid]
                    const d = this.drivers[p.driverid]
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
            switch (this.type) {
                case 'membership': headers.splice(2, 3); break // remove the session/event/car
                case 'payments':   headers.splice(3, 2); break // remove the session/car
                default:           headers.splice(2, 1); break // remove the event column when looking at a single event
            }
            return headers
        },
        title() {
            switch (this.type) {
                case 'membership': return 'Membership'
                case 'payments':   return 'Event Payments'
            }
            return ''
        }
    },
    methods: {
        refund(item) {
            this.dialogData = item.payment
            this.RefundDialog = true
        },
        editruns(item) {
            this.dialogData = Object.assign({ eventid: this.eventid }, item.car)
            this.RunEditDialog = true
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
        },
        loadRequired() {
            this.$store.dispatch('ensureTablesAndCarDriverInfo', ['payments', 'registered'])
        }
    },
    watch: {
        currentSeries() {
            this.loadRequired()
        }
    },
    async mounted() {
        this.loadRequired()
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
