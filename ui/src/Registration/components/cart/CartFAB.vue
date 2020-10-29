<template>
    <div>
        <v-speed-dial direction="bottom" transition="scale" v-model="fab" v-if="positiveCount > 1">
            <template v-slot:activator>
            <v-btn v-model="fab" color="secondary" dark>
                <v-icon v-if="fab">{{icons.mdiClose}}</v-icon>
                <template v-else><v-icon>{{icons.mdiCart}}</v-icon><v-icon>{{icons.mdiMultiplication}}</v-icon></template>
            </v-btn>
            </template>
            <v-btn dark class='myfab' color="secondary lighten-1" v-for="(cart,accountid) in seriesCarts" :key="accountid" @click="cartopen(accountid)">
                <span class='aname'>{{paymentaccounts[accountid].name}}</span><v-icon>{{icons.mdiCart}}</v-icon><span class='total'>{{cart.total|cents2dollars}}</span>
            </v-btn>
        </v-speed-dial>

        <v-btn class='righthang' color="secondary" dark v-else-if="positiveCount > 0" @click="cartopen(firstAccountId)">
            <v-icon>{{icons.mdiCart}}</v-icon><span class='total'>{{firstCart.total|cents2dollars}}</span>
        </v-btn>

        <CartDialog v-model=cartOpen :accountid="cartAccountId"></CartDialog>
    </div>
</template>

<script>
import { mdiCart, mdiClose, mdiMultiplication } from '@mdi/js'
import { mapState, mapGetters } from 'vuex'
import CartDialog from './CartDialog.vue'

export default {
    components: {
        CartDialog
    },
    data() {
        return {
            fab: false,
            cartOpen: false,
            cartAccountId: null,
            icons: {
                mdiCart,
                mdiClose,
                mdiMultiplication
            }
        }
    },
    computed: {
        ...mapState(['carts', 'paymentaccounts']),
        ...mapGetters(['seriesCarts']),
        positiveCount() {
            let count = 0
            for (const key in this.seriesCarts) {
                if (this.seriesCarts[key].total > 0) {
                    count += 1
                }
            }
            return count
        },
        firstAccountId() { return Object.keys(this.seriesCarts)[0] },
        firstCart() { return this.seriesCarts[this.firstAccountId] }
    },
    methods: {
        cartopen(accountid) {
            this.cartAccountId = accountid
            this.cartOpen = true
        }
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
