<template>
    <div class='reggrid'>
        <template v-for="grp in groups">
            <span class='sessionlabel' :key="grp.key+20">{{grp.key}}</span>
            <CarSelect :key="grp.key+30" :session=grp.session :index=grp.index :event=event></CarSelect>
            <PaymentInfo :key="grp.key+40"></PaymentInfo>
        </template>
    </div>
</template>

<script>
import findIndex from 'lodash/findIndex'
import { mapState } from 'vuex'
import { SeriesEvent, getSessions } from '@/common/event.ts'
import CarSelect from './CarSelect.vue'
import PaymentInfo from './PaymentInfo.vue'

export default {
    components: {
        PaymentInfo,
        CarSelect
    },
    props: {
        event: SeriesEvent
    },
    computed: {
        ...mapState(['registered']),
        ereg()     { return this.registered[this.event.eventid] || {} },
        groups()   {
            let ret = getSessions(this.event).map(s => ({ session: s, key: s }))
            if (!ret.length) {
                ret = [...new Array(this.event.perlimit).keys()].map(i => ({ index: i, key: i + 1 }))
            }
            for (const key of Object.keys(this.ereg)) {
                const reg = this.ereg[key]
                if (reg.session) {
                    if (findIndex(ret, { session: reg.session }) < 0) {
                        ret.push({ session: reg.session, key: reg.session })
                    }
                } else {
                    if (findIndex(ret, { index: reg.rorder }) < 0) {
                        ret.push({ index: reg.rorder, key: reg.rorder + 1 })
                    }
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
