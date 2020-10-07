<template>
    <div class='eventgrid'>
        <div>{{ item.name }}</div>
        <div>
            <div class='paygrid'>
                {{item.price|cents2dollars}}
                <v-checkbox v-if="map.maxcount < 2" :disabled="map.required" v-model="selection"></v-checkbox>
                <v-select v-else :items="[0,1,2]" hide-details solo dense :disabled="map.required" v-model="selection"></v-select>
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
        selection: {
            get() {
                return this.$store.getters.cartGetOther(this.currentSeries, this.event.accountid, this.event.eventid, this.item.itemid)
            },
            set(newValue) {
                this.$store.commit('cartSetOther', {
                    series: this.$store.state.currentSeries,
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
