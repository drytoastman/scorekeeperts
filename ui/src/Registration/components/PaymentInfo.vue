<template>
    <div>
        <div v-for="p in paymentsForReg" :key="p.payid" class='paid'>
            Paid
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
        event()  { return this.events[this.reg?.eventid] },
        isOpen() { return this.event ? isOpen(this.event) : false },
        paymentsForReg() {
            try {
                if (!this.event) { return [] }
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
    font-size: 80%;
    white-space: nowrap;
}
.paid {
    color: green;
    font-size: 90%;
}
.paymentinfo {
    font-size: 90%;
    color: var(--v-primary-base);
}
</style>
