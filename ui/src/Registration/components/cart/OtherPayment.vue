<template>
    <div>
        <div v-if="payments.length < map.maxcount">
            <v-checkbox v-if="map.maxcount < 2" :disabled="map.required || busy" v-model="selection" hide-details></v-checkbox>
            <v-select v-else :items="countlist" hide-details solo dense :disabled="map.required || busy" v-model="selection"></v-select>
        </div>
        <div v-if="payments.length" class='paidinfo'>
            <div v-for="p in payments" :key="p.payid">{{p.itemname}} {{p.amount|cents2dollars}}</div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'
export default {
    props: {
        event: Object,
        item: Object,
        map: Object
    },
    computed: {
        ...mapState(['busyReg']),
        payments() { return (this.$store.state.payments[this.event.eventid] || []).filter(p => p.itemname === this.item.name) },
        countlist() { return [...Array(this.map.maxcount + 1 - this.payments.length).keys()] },
        busy()    { return this.busyReg[this.event.eventid] === true },
        selection: {
            get() {
                return this.$store.getters.cartGetOther(this.event.accountid, this.event.eventid, this.item.itemid)
            },
            set(newValue) {
                this.$store.commit('cartSetOther', {
                    accountid: this.event.accountid,
                    eventid: this.event.eventid,
                    itemid: this.item.itemid,
                    value: newValue
                })
            }
        }
    }
}
</script>

<style scoped>
.v-input--checkbox {
    margin-top: 0;
}
</style>
