<template>
    <v-speed-dial top right absolute direction="bottom" transition="scale" v-model="fab" v-if="haveSums > 1">
        <template v-slot:activator>
        <v-btn v-model="fab" color="secondary" dark rounded>
            <v-icon v-if="fab">{{icons.mdiClose}}</v-icon>
            <template v-else><v-icon>{{icons.mdiCart}}</v-icon><v-icon>{{icons.mdiMultiplication}}</v-icon></template>
        </v-btn>
        </template>
        <v-btn dark class='myfab' color="secondary lighten-1" v-for="(sum,accountid) in allCartSums" :key="accountid">
            <span class='aname'>{{paymentaccounts[accountid].name}}</span><v-icon>{{icons.mdiCart}}</v-icon><span class='total'>{{sum.total|cents2dollars}}</span>
        </v-btn>
    </v-speed-dial>

    <v-btn color="secondary" dark rounded top right absolute v-else-if="haveSums > 0">
        <v-icon>{{icons.mdiCart}}</v-icon><span class='total'>{{firstSum.total|cents2dollars}}</span>
    </v-btn>
</template>

<script>
import { mdiCart, mdiClose, mdiMultiplication } from '@mdi/js'
import { mapState, mapGetters } from 'vuex'

export default {
    components: {
    },
    data() {
        return {
            fab: false,
            icons: {
                mdiCart,
                mdiClose,
                mdiMultiplication
            }
        }
    },
    computed: {
        ...mapState(['carts', 'paymentaccounts']),
        ...mapGetters(['allCartSums']),
        haveSums() { return Object.keys(this.allCartSums).length },
        firstAccountId() { return Object.keys(this.allCartSums)[0] },
        firstSum() { return this.allCartSums[this.firstAccountId] },
        cart() { return {} }
    }
}
</script>

<style lang="scss" scoped>
::v-deep .v-speed-dial__list {
    align-items: end;
    .myfab {
        margin-right: 0;
    }
}
.aname {
    font-size: 80%;
    margin-right: 0.5rem;
}
.total {
    display: inline-block;
    margin-left: 0.5rem;
    width: 4.0rem;
    text-align: right;
}
</style>
