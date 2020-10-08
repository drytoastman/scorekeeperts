<template>
    <div class='infowrap'>
        <div class='formgrid'>
            <template v-for="reg in sessions">
                <span class='sessionlabel' :key="reg.session+'x'">{{reg.session}}</span>
                <CarLabel :car="cars[reg.carid]" session :key="reg.session+'y'"></CarLabel>
                <PaymentInfo :reg="reg" :key="reg.session+'z'"></PaymentInfo>
            </template>
            <template v-for="(reg,ii) in nonsession">
                <span class='sessionlabel' :key="reg.carid">{{ii+1}}</span>
                <CarLabel :car="cars[reg.carid]" :key="reg.carid+'x'"></CarLabel>
                <PaymentInfo :reg="reg" :key="reg.carid+'y'"></PaymentInfo>
            </template>
            <template v-for="(count, itemname) in other">
                <span :key="itemname+1"></span>
                <span :key="itemname+2"></span>
                <span :key="itemname+3" class='itemname'>{{count}}x {{itemname}}</span>
            </template>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import { getSessions } from '@/common/event'
import CarLabel from '../../components/CarLabel.vue'
import PaymentInfo from './PaymentInfo.vue'

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
        ereg()     { return this.registered[this.event.eventid] || [] },
        nonsession() { return this.ereg.filter(r => r.session === '') },
        sessions() {
            // registrations with a session ordered by session order
            const ret = []
            for (const s of getSessions(this.event)) {
                for (const r of this.ereg) {
                    if (r.session === s) ret.push(r)
                }
            }
            return ret
        },
        other() {
            const ret = {}
            for (const p of (this.payments[this.event.eventid] || [])) {
                if (p.carid == null) {
                    if (!(p.itemname in ret)) ret[p.itemname] = 0
                    ret[p.itemname] += 1
                }
            }
            return ret
        }
    }
}
</script>

<style scoped lang="scss">
.formgrid {
    display: grid;
    grid-template-columns: auto auto 1fr;
    column-gap: 1rem;
    row-gap: 0.3rem;
    align-items: center;
    margin-bottom: 1rem;
}
.itemname {
    font-size: 90%;
    color: var(--v-primary-base)
}
.sessionlabel {
    font-weight: bold;
}
</style>
