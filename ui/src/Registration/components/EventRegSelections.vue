<template>
    <div class='outer'>
        <div v-for="grp in groups" :key="grp.key" class='regrow'>
            <span class='sessionlabel'>{{grp.key}}</span>
            <CarSelect  :session=grp.session :index=grp.index :event=event class='select'></CarSelect>
            <CarPayment :session=grp.session :index=grp.index :event=event class='payment'></CarPayment>
        </div>
        <div v-for="other in $store.getters.eventotherfees(event.eventid)" :key="other.item.itemid" class='regrow'>
            <div class='name'>{{ other.item.name }}</div>
            <div class='price'>{{ other.item.price|cents2dollars }}</div>
            <OtherPayment :event=event :item="other.item" :map="other.map" class='payment'></OtherPayment>
        </div>
    </div>
</template>

<script>
import range from 'lodash/range'
import findIndex from 'lodash/findIndex'
import { mapState } from 'vuex'
import { SeriesEvent, getSessions } from '@/common/event.ts'
import CarSelect from './CarSelect.vue'
import CarPayment from './cart/CarPayment.vue'
import OtherPayment from './cart/OtherPayment.vue'

export default {
    components: {
        CarSelect,
        CarPayment,
        OtherPayment
    },
    props: {
        event: SeriesEvent
    },
    computed: {
        ...mapState(['cars', 'registered']),
        groups() {
            const ereg = this.registered[this.event.eventid] || {}
            const ret = getSessions(this.event).map(s => ({ session: s, key: s }))

            if (!ret.length) {
                // no session
                for (const ii of range(this.event.perlimit)) {
                    ret.push({ index: ii, session: '', key: ii + 1 })
                    if (!ereg[ii]) break // only one blank allowed
                }
            }

            for (const key of Object.keys(ereg)) {
                const reg = ereg[key]
                if (reg.session) {
                    if (findIndex(ret, { session: reg.session }) < 0) {
                        ret.push({ session: reg.session, key: reg.session })
                    }
                } else {
                    if (findIndex(ret, { index: reg.rorder }) < 0) {
                        ret.push({ index: reg.rorder, session: '', key: reg.rorder + 1 })
                    }
                }
            }
            return ret
        },
        limitReached() { return this.limitTypeReached !== null },
        limitTypeReached() {
            if (!this.event) { return null }
            if (this.checkedCount >= this.event.perlimit) {
                return `Personal limit of ${this.event.perlimit} met`
            } else if (this.event.totlimit) {
                if (this.ecounts.all - this.ereg.length + this.checkedCount >= this.event.totlimit) {
                    return `Event limit of ${this.event.totlimit} met`
                }
            }
            return null
        }
    }
}
</script>

<style scoped lang="scss">
.outer {
    width: 100%;
}
.regrow {
    display: flex;
    column-gap: 1rem;
    margin-bottom: 0.5rem;
    align-items: center;
    flex-wrap: wrap;

    .sessionlabel {
        font-weight: bold;
        flex-basis: 3rem;
        flex-grow: 0;
        text-align: center;
    }
    .select {
        flex-basis: 16rem;
        flex-grow: 0.0;
    }

    .name {
        flex-basis: 16rem;
        flex-grow: 0.0;
        font-size: 90%;
        font-weight: bold;
        color: #333;
        text-align: right;
    }
    .price {
        flex-basis: 3rem;
        flex-grow: 0;
        font-size: 90%;
        color: #333;
    }

    .payment {
        flex-basis: 16rem;
        flex-grow: 0;
    }
}
</style>
