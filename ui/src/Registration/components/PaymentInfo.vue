<template>
    <div>
        <div v-for="p in paymentsForReg" :key="p.payid">
            {{p.amount|cents2dollars}} ({{p.itemname}})
        </div>
        <div v-if="isOpen && event.attr.paymentreq && !paymentsForReg.length" class='paymentreq'>
            Payment Required
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import { isOpen } from '@/common/event'

export default {
    props: {
        reg: Object // Registration
    },
    computed: {
        ...mapState(['events', 'cars', 'payments']),
        event()  { return this.events[this.reg.eventid] },
        isOpen() { return isOpen(this.event) },
        paymentsForReg() {
            try {
                return this.payments[this.reg.eventid].filter(p => p.carid === this.reg.carid && p.session === this.reg.session && !p.refunded) || []
            } catch {}
            return []
        }
    }
}
</script>

<style scoped>
    .paymentreq {
        color: red;
    }
</style>
