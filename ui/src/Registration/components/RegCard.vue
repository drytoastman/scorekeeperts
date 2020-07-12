<template>
    <v-card class='regcard' outlined>
        <v-card-title v-if="!reg.session">
            <CarLabel :car=car fontsize="85%"></CarLabel>
        </v-card-title>
        <v-card-text>
            <div v-if="reg.session">
                Session: {{reg.session}}
                <SessionCarLabel :car=car :session="reg.session" fontsize="110%" display="inline"></SessionCarLabel>
            </div>
            <div v-for="p in paymentsForReg" :key="p.payid">
                {{p.amount|cents2dollars}} ({{p.itemname}})
            </div>
            <div v-if="isOpen && event.attr.paymentreq && !paymentsForReg.length" class='paymentreq'>
                Payment Required
            </div>
        </v-card-text>
    </v-card>
</template>

<script>
import { mapState } from 'vuex'
import { Registration } from '@common/lib'
import { isOpen } from '@common/lib/event'
import CarLabel from '../../components/CarLabel'
import SessionCarLabel from '../../components/SessionCarLabel'

export default {
    components: {
        CarLabel,
        SessionCarLabel
    },
    props: {
        reg: Registration
    },
    computed: {
        ...mapState(['events', 'cars', 'payments']),
        car()   { return this.cars[this.reg.carid] },
        event() { return this.events[this.reg.eventid] },
        isOpen() { return isOpen(this.event) },
        paymentsForReg() {
            try { return this.payments[this.reg.eventid].filter(p => p.carid === this.reg.carid && p.session === this.reg.session && !p.refunded) || [] } catch {}
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
