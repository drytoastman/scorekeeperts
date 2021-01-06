<template>
    <div class='outer'>
        <div v-if=eventLimitReached class='limiterror'>
            Event Registration Limit Reached
        </div>
        <div v-for="grp in groups" :key="grp.key">
            <div class='regrow'>
                <template v-if="isOpen || ereg[grp.index] || ereg[grp.session]">
                    <span class='sessionlabel'>{{grp.key}}</span>
                    <template v-show="!nocars[grp.key]">
                        <CarSelect
                            :session=grp.session :index=grp.index :event=event :locked="!isOpen" class='select'
                            @nocars="$set(nocars, grp.key, $event)">
                        </CarSelect>

                        <CarPayment
                            :session=grp.session :index=grp.index :event=event :locked="!isOpen" class='payment'
                            v-if='event.accountid'>
                        </CarPayment>
                    </template>

                    <LinkHoverToState v-show="!!nocars[grp.key] && isOpen" :to="{name:'cars'}" variable="flashCars" class='carslink'>
                        Create, Edit and Delete Cars Via the Cars Menu
                    </LinkHoverToState>
                </template>
            </div>
        </div>
        <div v-for="other in $store.getters.eventotherfees(event.eventid)" :key="other.item.itemid" class='regrow'>
            <template v-if="isOpen">
                <div class='name' >{{ other.item.name }}</div>
                <div class='price'>{{ other.item.price|cents2dollars }}</div>
            </template>
            <template v-else>
                <div class='name'></div>
                <div class='price'></div>
            </template>
            <OtherPayment :event=event :item="other.item" :map="other.map" class='payment' :locked="!isOpen"></OtherPayment>
        </div>
    </div>
</template>

<script>
import range from 'lodash/range'
import findIndex from 'lodash/findIndex'
import { mapState } from 'vuex'

import { getSessions } from 'sctypes/event'
import CarSelect from './CarSelect.vue'
import CarPayment from './cart/CarPayment.vue'
import OtherPayment from './cart/OtherPayment.vue'
import LinkHoverToState from './LinkHoverToState.vue'
import { SessionIndexMixin } from '@/components/SessionIndexMixin.js'

export default {
    mixins: [SessionIndexMixin],
    components: {
        CarSelect,
        CarPayment,
        OtherPayment,
        LinkHoverToState
    },
    props: {
        event: Object
    },
    data() {
        return {
            nocars: {}
        }
    },
    computed: {
        ...mapState(['cars', 'counts']),
        groups() {
            const ret = getSessions(this.event).map(s => ({ session: s, key: s }))

            if (!ret.length) {
                // no session
                for (const ii of range(this.event.perlimit)) {
                    if (this.eventLimitReached && !this.ereg[ii]) break // no blank if limit hit
                    ret.push({ index: ii, session: '', key: ii + 1 })
                    if (!this.ereg[ii]) break // only one blank allowed max
                }
            }

            for (const key of Object.keys(this.ereg)) {
                const reg = this.ereg[key]
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
    .carslink {
        grid-column: 2 / span 4;
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
