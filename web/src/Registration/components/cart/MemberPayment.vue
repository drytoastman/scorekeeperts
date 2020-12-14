<template>
    <v-select :items="feeselections" return-object hide-details outlined label="Membership Fee" item-value="itemid" v-model="selection">
        <template v-slot:selection="d">
            <div v-if="d.item.itemid">
                <span class='name' v-if="d.item.itemid">{{ d.item.name }}</span>
                <span class='price'>{{ d.item.price|cents2dollars }}</span>
            </div>
            <div v-else class='selectblanknote'>Pay Here</div>
        </template>
        <template v-slot:item="d">
            <span class='name'>{{ d.item.name }}</span> <span class='price'>{{ d.item.price|cents2dollars }}</span>
        </template>
    </v-select>
</template>

<script>
import { mapGetters, mapState } from 'vuex'

export default {
    computed: {
        ...mapState(['settings']),
        ...mapGetters(['membershipfees']),
        feeselections() { return [{ itemid: null }, ...this.membershipfees] },
        selection: {
            get() {
                return this.$store.getters.cartGetMembership(this.settings.membershipaccount) || null // not undefined
            },
            set(item) {
                this.$store.commit('cartSetMembership', {
                    accountid: this.settings.membershipaccount,
                    value: item.itemid
                })
            }
        }
    }
}
</script>

<style scoped>
.name {
    margin-right: 1rem;
    font-size: 90%;
}
</style>
