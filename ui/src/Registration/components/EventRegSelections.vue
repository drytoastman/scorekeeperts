<template>
    <div class='reggrid'>
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
        event: Object
    },
    computed: {
        ...mapState(['cars', 'registered']),
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
        }
    }
}
</script>

<style scoped lang="scss">
.reggrid {
    display: inline-grid;
    grid-template-columns: auto auto 1fr;
    column-gap: 1rem;
    row-gap: 0.3rem;
    align-items: center;
    margin-bottom: 1rem;
}
.sessionlabel {
    font-weight: bold;
}
</style>
