<template>
    <div class='outer'>
        <div class='adminbuttons'>
            <v-btn color="secondary" :disabled="unchanged" @click="reset">Reset</v-btn>
            <v-btn color="secondary" :disabled="unchanged" @click="savePayments">Save</v-btn>
        </div>
        <Payments :eventm="eventm"></Payments>
    </div>
</template>

<script>
import Vue from 'vue'
import { mapState } from 'vuex'
import cloneDeep from 'lodash/cloneDeep'
import isEqual from 'lodash/isEqual'
import Payments from './Payments.vue'
import { createEventItems } from '@/common/event'

export default {
    name: 'PaymentSettings',
    components: {
        Payments
    },
    props: {
        seriesevent: Object
    },
    data() {
        return {
            saveeventdata: {},
            eventm: { attr: {}}
        }
    },
    computed: {
        ...mapState(['paymentitems']),
        unchanged() { return isEqual(this.saveeventdata, this.eventm) }
    },
    methods: {
        savePayments() {
            const emod = cloneDeep(this.seriesevent)
            emod.accountid       = this.eventm.accountid
            emod.attr.paymentreq = this.eventm.attr.paymentreq
            emod.items           = this.eventm.items.filter(m => m.checked).map(m => m.map)

            this.$store.dispatch('setdata', {
                type: 'update',
                items: { events: [emod] }
            })
        },
        reset() {
            this.saveeventdata = cloneDeep(this.seriesevent)
            if (!this.saveeventdata.attr.paymentreq) {
                Vue.set(this.saveeventdata.attr, 'paymentreq', false)
            }
            this.saveeventdata.items = createEventItems(Object.values(this.paymentitems), this.seriesevent.items, this.seriesevent.eventid)
            this.eventm = cloneDeep(this.saveeventdata)
        }
    },
    watch: {
        seriesevent() { this.reset() },
        paymentitems() { this.reset() }
    },
    mounted() { this.reset() }
}
</script>

<style scoped>
</style>
