<template>
    <div class='outer'>
        <div v-if="sizeWarning" class='sizewarning'>The display width is less then the recommended minimum 950px for this tool</div>
        <div class='twocol'>
            <DriverSearchSelect :driverbrief="driverbrief" @add="addid" @del="delid"></DriverSearchSelect>
            <div class='displaybox'>
                <div v-for="driver in selectedDrivers" :key="driver.driverid" class='driverbox'>
                    <DriverEditorDisplay :driver=driver @buttons='buttons'></DriverEditorDisplay>
                </div>
            </div>
        </div>
        <DriverDialog :driver="dialogData" :apiType="dialogType" v-model=driverDialog></DriverDialog>
        <CarDialog    :car="dialogData"    :apiType="dialogType" v-model=carDialog :eClasses="eClasses" :eIndexes="eIndexes" :eSeries="eSeries"></CarDialog>
    </div>
</template>

<script>
import isEmpty from 'lodash/isEmpty'
import { mapState } from 'vuex'
import Vue from 'vue'
import DriverSearchSelect from '../components/DriverSearchSelect'
import DriverEditorDisplay from '../components/DriverEditorDisplay'
import DriverDialog from '../../components/DriverDialog'
import CarDialog from '../../components/CarDialog'

export default {
    name: 'DriverEditor',
    components: {
        DriverSearchSelect,
        DriverEditorDisplay,
        DriverDialog,
        CarDialog
    },
    data() {
        return {
            selected: {},
            driverbrief: undefined,
            allclassindex: undefined,
            dialogData: undefined,
            dialogType: '',
            driverDialog: false,
            carDialog: false,
            eClasses: undefined,
            eIndexes: undefined,
            eSeries: undefined
        }
    },
    computed: {
        ...mapState(['drivers', 'cars']),
        selectedDrivers() {
            return Object.keys(this.selected).map(did => this.drivers[did]).filter(v => v)
        },
        sizeWarning() {
            return this.$vuetify.breakpoint.width < 950
        }
    },
    methods: {
        addid(driverid) {
            Vue.set(this.selected, driverid, 1)
            this.$store.dispatch('ensureEditorInfo', [driverid])
        },
        delid(driverid) {
            Vue.delete(this.selected, driverid)
        },
        buttons(name, id, series) {
            this.eSeries = series
            if (series) {
                this.eClasses = this.allclassindex[series].classes
                this.eIndexes = this.allclassindex[series].indexes
            }

            switch (name) {
                case 'editdriver':
                    this.dialogData = this.drivers[id]
                    this.dialogType = 'update'
                    this.driverDialog = true
                    break
                case 'deldriver':
                    this.dialogData = this.drivers[id]
                    this.dialogType = 'delete'
                    this.driverDialog = true
                    break
                case 'merge':
                    break
                case 'reset':
                    break
                case 'editcar':
                    this.dialogData = this.cars[id]
                    this.dialogType = 'update'
                    this.carDialog = true
                    break
                case 'delcar':
                    this.dialogData = this.cars[id]
                    this.dialogType = 'delete'
                    this.carDialog = true
                    break
                default:
                    console.log(`${name} ${id} ${series}`)
            }
        }
    },
    mounted() {
        if (isEmpty(this.driverbrief)) {
            this.$store.dispatch('getdata', { items: 'driverbrief,allclassindex' }).then(data => {
                this.driverbrief = data.driverbrief
                const all = {}
                for (const [series, clsidx] of Object.entries(data.allclassindex)) {
                    all[series] = { classes: {}, indexes: {} }
                    for (const entry of clsidx.classes) all[series].classes[entry.classcode] = entry
                    for (const entry of clsidx.indexes) all[series].indexes[entry.indexcode] = entry
                }
                this.allclassindex = all
            })
        }
    }
}
</script>

<style lang="scss" scoped>
.sizewarning {
    background: yellow;
    font-size: 80%;
    color: #777;
}
.twocol {
    display: flex;
    column-gap: 1rem;
}
</style>
