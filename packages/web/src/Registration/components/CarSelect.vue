<template>
    <div>
        <v-select :items="carlist" :disabled="busy" item-value="carid" v-model="selectedcarid" hide-details solo ref='select' v-if="!locked">
            <template v-slot:item="d">
                <div v-if="!d.item.carid" class='selectblanknote'>Unregister</div>
                <CarLabel v-else :car=d.item :session="!!session"></CarLabel>
            </template>
            <template v-slot:selection="d">
                <div v-if="!d.item.carid" class='selectblanknote'>Register Here</div>
                <CarLabel v-else :car=d.item :session="!!session"></CarLabel>
            </template>
        </v-select>
        <CarLabel v-else :car=cars[selectedcarid] :session="!!session"></CarLabel>
    </div>
</template>

<script>
import cloneDeep from 'lodash/cloneDeep'
import orderBy from 'lodash/orderBy'
import { mapState } from 'vuex'
import CarLabel from '@/components/CarLabel.vue'
import { SessionIndexMixin } from '@/components/SessionIndexMixin.js'

export default {
    mixins: [SessionIndexMixin],
    components: {
        CarLabel
    },
    props: {
        event: Object,
        session: String,
        index: Number,
        locked: Boolean
    },
    computed: {
        ...mapState(['cars']),
        carlist() {
            let all = Object.values(this.cars)
            if (!this.session) {
                const used = Object.values(this.ereg).map(c => c.carid).filter(id => id !== this.mycarid)
                all = all.filter(c => !used.includes(c.carid))
                all = orderBy(all, ['classcode', 'number'])
            } else {
                all = orderBy(all, ['number'])
            }
            this.$emit('nocars', all.length === 0)
            return [{ carid: null }, ...all]
        },
        selectedcarid: {
            get() {
                return this.mycarid || null // not undefined
            },
            set(newcarid) {
                if (!this.selectedcarid && !newcarid) return
                if (this.selectedcarid === newcarid) return

                const ereg = cloneDeep(this.ereg)
                const saveprevid = this.selectedcarid
                ereg[this.key] = newcarid ? {
                    eventid: this.event.eventid,
                    session: this.session,
                    rorder: this.index,
                    carid: newcarid
                } : undefined

                this.$store.dispatch('setdata', {
                    type: 'eventupdate',
                    eventid: this.event.eventid,
                    items: { registered: Object.values(ereg).filter(v => v) },
                    busy: { key: 'busyReg', id: this.event.eventid }
                }).then(() => {
                    // on return from server set, force a refresh of ths selected value in case of errors, etc
                    if (this.$refs.select) this.$refs.select.setValue(this.selectedcarid)
                    // clear previous selection
                    this.$store.commit('cartSetCar', {
                        accountid: this.event.accountid,
                        eventid: this.event.eventid,
                        carid: saveprevid,
                        session: this.session,
                        value: undefined
                    })
                })
            }
        }
    }
}
</script>

<style scoped lang='scss'>
.v-text-field {
    padding-top: 0;
}
::v-deep {
    .v-list-item--active {
        opacity: 0.4;
        pointer-events: none;
    }
}
</style>
