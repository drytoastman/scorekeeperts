<template>
    <div class='outer'>
        <div v-if=eventLimitReached class='limiterror'>
            Event Registration Limit Reached
        </div>
        <div v-for="grp in groups" :key="grp.key" class='regrow'>
            <span class='sessionlabel'>{{grp.key}}</span>
            <CarSelect  :session=grp.session :index=grp.index :event=event class='select'></CarSelect>
            <CarPayment :session=grp.session :index=grp.index :event=event class='payment' v-if='event.accountid'></CarPayment>
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
import { getSessions } from '@/common/event.ts'
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
        event: Object
    },
    computed: {
        ...mapState(['cars', 'registered', 'counts']),
        groups() {
            const ereg = this.registered[this.event.eventid] || {}
            const ret = getSessions(this.event).map(s => ({ session: s, key: s }))

            if (!ret.length) {
                // no session
                for (const ii of range(this.event.perlimit)) {
                    if (this.eventLimitReached && !ereg[ii]) break // no blank if limit hit
                    ret.push({ index: ii, session: '', key: ii + 1 })
                    if (!ereg[ii]) break // only one blank allowed max
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
        eventLimitReached() {
            if (this.event && this.event.totlimit) {
                return (this.counts[this.event.eventid].all >= this.event.totlimit)
            }
            return false
        }
    }
}
</script>

<style scoped lang="scss">
.outer {
    width: 100%;
}
.limiterror {
    text-align: center;
    color: red;
    margin-bottom: 1rem;
}
.regrow {
    display: grid;
    grid-template-columns: 3rem 14rem 3rem 16rem;
    column-gap: 1rem;
    align-items: center;

    * {
        margin-bottom: 0.5rem;
    }
    .sessionlabel {
        font-weight: bold;
        text-align: center;
    }
    .select {
        grid-column: 2 / span 2;
    }
    .name {
        font-size: 90%;
        font-weight: bold;
        color: #333;
        text-align: right;
        grid-column: 1 / span 2;
    }
    .price {
        font-size: 90%;
        color: #333;
    }

    @media (max-width: 700px) {
        grid-template-columns: 3rem 14rem 3rem;
        .payment {
            grid-column: 2 / span 2;
            margin-bottom: 1.5rem;
        }
        .name {
            text-align: left;
        }
    }
}
</style>
