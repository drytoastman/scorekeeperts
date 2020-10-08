<template>
    <div class='eventgrid' v-if="payments.length < map.maxcount">
        <div>{{ item.name }}</div>
        <div>
            <div class='paygrid'>
                {{item.price|cents2dollars}}
                <v-checkbox v-if="map.maxcount < 2" :disabled="map.required" v-model="selection"></v-checkbox>
                <v-select v-else :items="countlist" hide-details solo dense :disabled="map.required" v-model="selection"></v-select>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        event: Object,
        item: Object,
        map: Object
    },
    computed: {
        payments() { return (this.$store.state.payments[this.event.eventid] || []).filter(p => p.itemname === this.item.name) },
        countlist() { return [...Array(this.map.maxcount + 1 - this.payments.length).keys()] },
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
.paygrid {
    display: grid;
    align-items: center;
    grid-template-columns: 2fr 3fr;
}
</style>
