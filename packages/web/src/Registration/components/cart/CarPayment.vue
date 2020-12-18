<template>
    <div class='paymentwrap'>
        <div v-if="payments.length || locked" class='paidinfo'>
            <div v-for="p in payments" :key="p.payid">{{p.itemname}} {{p.amount|cents2dollars}}</div>
        </div>
        <v-select v-else-if="mycarid" :disabled="busy" :items="entryfees" return-object hide-details solo item-value="itemid" v-model="selection">
            <template v-slot:selection="d">
                <div v-if="d.item.itemid">
                    <span class='name' v-if="d.item.itemid">{{ d.item.name }}</span>
                    <span class='price'>{{ d.item.price|cents2dollars }}</span>
                </div>
                <template v-else>
                    <div class='paymentreq selectblanknote' v-if="mycarid && event.attr.paymentreq && !payments.length">Payment Required</div>
                    <div class='selectblanknote' v-else>Pay Here</div>
                </template>
            </template>
            <template v-slot:item="d">
                <span class='name'>{{ d.item.name }}</span> <span class='price'>{{ d.item.price|cents2dollars }}</span>
            </template>
        </v-select>
        <div v-else>
        </div>
    </div>
</template>

<script>
import { SessionIndexMixin } from '@/components/SessionIndexMixin.js'

export default {
    mixins: [SessionIndexMixin],
    components: {
    },
    props: {
        event: Object,
        session: String,
        index: Number,
        locked: Boolean
    },
    computed: {
        entryfees() {
            return [{ itemid: null }, ...this.$store.getters.evententryfees(this.event.eventid)]
        },
        payments()  { return (this.$store.state.payments[this.event.eventid] || []).filter(p => p.carid === this.mycarid && p.session === this.session && !p.refunded) },
        selection: {
            get() {
                return this.$store.getters.cartGetCar(this.event.accountid, this.event.eventid, this.mycarid, this.session) || null // not undefined
            },
            set(item) {
                this.$store.commit('cartSetCar', {
                    accountid: this.event.accountid,
                    eventid: this.event.eventid,
                    carid: this.mycarid,
                    session: this.session,
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
.v-select {
    display: inline-block;
}
.paymentwrap {
    display: flex;
}
.paymentreq {
    color: red;
}
</style>
