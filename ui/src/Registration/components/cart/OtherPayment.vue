<template>
    <div>
        <div v-if="payments.length < map.maxcount">
            <v-select :items="countlist" hide-details solo :disabled="map.required || busy" v-model="selection">
                <template v-slot:selection="d">
                    <div v-if="d.item.text">{{d.item.text}}</div>
                    <div class='selectblanknote' v-else>Pay Here</div>
                </template>
                <template v-slot:item="d">
                    {{d.item.text}}
                </template>
            </v-select>
        </div>
        <div v-if="payments.length" class='paidinfo'>
            <div v-for="p in payments" :key="p.payid">{{p.itemname}} {{p.amount|cents2dollars}}</div>
        </div>
    </div>
</template>

<script>
import range from 'lodash/range'
import { mapState } from 'vuex'
export default {
    props: {
        event: Object,
        item: Object,
        map: Object
    },
    computed: {
        ...mapState(['busyReg']),
        payments() { return (this.$store.state.payments[this.event.eventid] || []).filter(p => p.itemname === this.item.name && !p.refunded) },
        countlist() { return [null, ...range(1, this.map.maxcount + 1 - this.payments.length)].map(i => ({ value: i, text: i })) },
        busy()    { return this.busyReg[this.event.eventid] === true },
        selection: {
            get() {
                return this.$store.getters.cartGetOther(this.event.accountid, this.event.eventid, this.item.itemid) || null
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
