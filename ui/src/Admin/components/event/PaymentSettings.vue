<template>
    <div class='inset'>
        <Payments :eventm="eventm" :uiitems="uiitems"></Payments>
        <div class='adminbuttons'>
            <v-btn color="secondary" :disabled="unchanged" @click="reset">Reset</v-btn>
            <v-btn color="secondary" :disabled="unchanged" @click="savePayments">Save</v-btn>
        </div>
    </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import cloneDeep from 'lodash/cloneDeep'
import isEqual from 'lodash/isEqual'
import Payments from './Payments.vue'

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
            eventm: { attr: {}},
            saveitems: [],
            uiitems: []
        }
    },
    computed: {
        ...mapState(['paymentitems', 'itemeventmap']),
        ...mapGetters(['eventUIItems']),
        unchanged() { return isEqual(this.seriesevent, this.eventm) && isEqual(this.saveitems, this.uiitems) }
    },
    methods: {
        savePayments() {
            const emod = cloneDeep(this.seriesevent)
            emod.accountid       = this.eventm.accountid
            emod.attr.paymentreq = this.eventm.attr.paymentreq

            this.$store.dispatch('setdata', {
                type: 'eventupdate',
                eventid: this.seriesevent.eventid,
                items: {
                    events: [emod],
                    itemeventmap: this.uiitems.filter(m => m.checked).map(m => m.map)
                }
            })
        },
        reset() {
            this.saveitems = this.eventUIItems(this.seriesevent.eventid)
            this.eventm  = cloneDeep(this.seriesevent)
            this.uiitems = cloneDeep(this.saveitems)
        }
    },
    watch: {
        seriesevent() { this.reset() },
        paymentitems() { this.reset() },
        itemeventmap: {
            deep: true,
            handler() { this.reset() }
        }
    },
    mounted() { this.reset() }
}
</script>

<style scoped>
</style>
