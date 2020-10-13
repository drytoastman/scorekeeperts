<template>
    <v-select :items="carlist" :disabled="busy" item-value="carid" v-model="selectedcarid" hide-details ref='select'>
        <template v-slot:item="d"><CarLabel :car=d.item :session="!!session"></CarLabel></template>
        <template v-slot:selection="d"><CarLabel :car=d.item :session="!!session"></CarLabel></template>
    </v-select>
</template>

<script>
import cloneDeep from 'lodash/cloneDeep'
import { mapState } from 'vuex'
import CarLabel from '../../components/CarLabel.vue'

export default {
    components: {
        CarLabel
    },
    props: {
        event: Object,
        session: String,
        index: Number
    },
    computed: {
        ...mapState(['cars', 'registered', 'busyReg']),
        ereg()    { return this.registered[this.event.eventid] || [] },
        carlist() {
            let all = [{ carid: '' }, ...Object.values(this.cars)]
            if (!this.session) {
                const used = Object.values(this.ereg).map(c => c.carid).filter(id => id !== this.mycarid)
                all = all.filter(c => !used.includes(c.carid))
            }
            return all
        },
        busy()    { return this.busyReg[this.event.eventid] === true },
        key()     { return this.session || this.index },
        mycarid() { return this.ereg[this.key]?.carid },
        selectedcarid: {
            get() {
                return this.mycarid
            },
            set(newcarid) {
                if (!this.selectedcarid && !newcarid) return
                if (this.selectedcarid === newcarid) return

                const ereg = cloneDeep(this.ereg)
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
                    console.log('refresh ' + this.selectedcarid)
                    this.$refs.select.setValue(this.selectedcarid)
                })
            }
        }
    },
    watch: {
        busy(newv) {
            // on return from server set, force a refresh of ths selected value in case of errors, etc
            // if (!newv) this.$refs.select.setValue(this.selectedcarid)
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
        background: #ddd;
        opacity: 0.4;
    }
    .v-input--is-disabled {
        opacity: 0.4;
    }
}
.sessionlabel {
    font-weight: bold;
    font-size: 120%;
}
</style>
