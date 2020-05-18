<template>
    <v-card class='regcard' outlined>
        <v-card-title v-if="!reg.session">
            <CarLabel :car=car fontsize="85%"></CarLabel>
        </v-card-title>
        <v-card-text>
            <SessionCarLabel v-if="reg.session" :car=car fontsize="105%" display="inline"></SessionCarLabel>
            <div v-if="reg.session">
                Session: {{reg.session}}
            </div>
            <div v-for="p in paymentsForReg" :key="p.payid">
                {{p.amount|dollars}} ({{p.itemname}})
            </div>
            <div v-if="wrap.isOpen() && wrap.event.attr.paymentreq && !paymentsForReg.length" class='paymentreq'>
                Payment Required
            </div>
        </v-card-text>
    </v-card>
</template>

<script>
import { mapState } from 'vuex'
import { EventWrap, Registration } from '@common/lib'
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
        wrap()  { return new EventWrap(this.event) },
        paymentsForReg() {
            try { return this.payments[this.reg.eventid][this.reg.carid] || [] } catch {}
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
