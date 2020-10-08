<template>
    <div class='eventgrid' v-if="!payments.length">
        <div>
            {{session}}
            <CarLabel style='display:inline-block' :car=car :session="!!session" fontsize="110%"></CarLabel>
        </div>

        <v-select :items="entryfees" return-object hide-details solo dense item-value="itemid" v-model="selection">
            <template v-slot:selection="d">
                <span class='name'>{{ d.item.name }}</span> <span class='price'>{{ d.item.price|cents2dollars }}</span>
            </template>
            <template v-slot:item="d">
                <span class='name'>{{ d.item.name }}</span> <span class='price'>{{ d.item.price|cents2dollars }}</span>
            </template>
        </v-select>
    </div>
</template>

<script>
import CarLabel from '@/components/CarLabel.vue'

export default {
    components: {
        CarLabel
    },
    props: {
        event: Object,
        car: Object,
        session: String
    },
    computed: {
        entryfees() { return [{ itemid: null, name: '' }, ...this.$store.getters.evententryfees(this.event.eventid)] },
        payments()  { return (this.$store.state.payments[this.event.eventid] || []).filter(p => p.carid === this.car.carid && p.session === this.session) },
        selection: {
            get() {
                return this.$store.getters.cartGetCar(this.event.accountid, this.event.eventid, this.car.carid, this.session)
            },
            set(item) {
                this.$store.commit('cartSetCar', {
                    accountid: this.event.accountid,
                    eventid: this.event.eventid,
                    carid: this.car.carid,
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
</style>
