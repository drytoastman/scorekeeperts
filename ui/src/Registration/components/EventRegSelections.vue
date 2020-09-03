<template>
    <div class='formgrid'>
        <template v-for="session in sessions">
            <span class='sessionlabel' :key="session+'y'">{{session}}</span>
            <CarLabel :car="cars[sessionselect[session].carid]" session :key="session"></CarLabel>
            <PaymentInfo :reg="sessionselect[session]" :key="session+'z'"></PaymentInfo>
        </template>
        <template v-for="(reg,ii) in nonsession">
            <span class='sessionlabel' :key="reg.carid">Entry {{ii+1}}</span>
            <CarLabel :car="cars[reg.carid]" :key="reg.carid+'x'"></CarLabel>
            <PaymentInfo :reg="reg" :key="reg.carid+'y'"></PaymentInfo>
        </template>
    </div>
</template>

<script>
import keyBy from 'lodash/keyBy'
import { mapState } from 'vuex'
import { getSessions } from '@/common/event'
import CarLabel from '../../components/CarLabel'
import PaymentInfo from './PaymentInfo'

export default {
    components: {
        CarLabel,
        PaymentInfo
    },
    props: {
        value: Boolean,
        event: Object
    },
    computed: {
        ...mapState(['cars', 'registered', 'payments']),
        nocars()   { return Object.values(this.cars).length <= 0 },
        ereg()     { return this.registered[this.event.eventid] || [] },
        sessions() { return getSessions(this.event) },
        sessionselect() { return keyBy(this.ereg, r => r.session) },
        nonsession() { return this.ereg.filter(r => r.session === '') }
    },
    methods: {
        paymentsForReg(reg) {
            try { return this.payments[reg.eventid].filter(p => p.carid === reg.carid && p.session === reg.session && !p.refunded) || [] } catch {}
            return []
        }
    }
}
</script>

<style scoped>
.formgrid {
    display: grid;
    grid-template-columns: auto auto 1fr;
    column-gap: 1rem;
    align-items: center;
    margin-bottom: 1rem;
}
</style>
