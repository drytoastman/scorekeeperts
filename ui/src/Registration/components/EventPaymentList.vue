<template>
    <div class='paygrid' v-if="payments.length">
        <template v-for="p in payments">
            <span :key="p.key+1" class='prefix'>{{p.prefix}}</span>
            <span :key="p.key+2" class='name'>{{p.name}}</span>
            <span :key="p.key+3" class='sum'>{{p.cents|cents2dollars}}</span>
        </template>
    </div>
</template>

<script>
import orderBy from 'lodash/orderBy'
import { mapState } from 'vuex'
export default {
    props: {
        paypurchases: Array
    },
    computed: {
        ...mapState(['cars', 'paymentitems']),
        payments() {
            if (!this.paypurchases) return []
            const mod = this.paypurchases.map((p, ii) => Object.assign(p, {
                key:    p.payid    || p.itemid + ii,
                prefix: p.session  || this.cars[p.carid]?.classcode || '',
                name:   p.itemname || this.paymentitems[p.itemid].name,
                cents:  p.amount   || p.sum
            }))
            return orderBy(mod, v => [v.prefix + 'z', v.name])
        }
    }
}
</script>

<style scoped lang="scss">
.paygrid {
    display: grid;
    grid-template-columns: 3rem auto 4rem;
    column-gap: 1rem;
    row-gap: 0.3rem;
    margin-bottom: 1rem;
    .prefix, .name, .sum {
        font-size: 14px;
        color: var(--v-primary-base)
    }
    .sum {
        text-align: right;
    }
    span {
        white-space: nowrap;
    }
}
</style>
