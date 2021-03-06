<template>
    <div class='outer'>
        <div v-if="sizeWarning" class='sizewarning'>The display width is less then the recommended minimum 950px for this tool</div>
        <div class='twocol'>
            <DriverSearchSelect :driverbrief="driverbrief" @add="addid" @del="delid" ref="search"></DriverSearchSelect>
            <div class='displaybox'>
                <div v-for="driver in selectedDrivers" :key="driver.driverid" class='driverbox'>
                    <DriverEditorDisplay :driver=driver :selectedCount=selectedCount @buttons='buttons'></DriverEditorDisplay>
                </div>
            </div>
        </div>
        <DriverDialog :driver="dialogData" :apiType="dialogType" v-model=driverDialog @complete='driverComplete'></DriverDialog>
        <CarDialog    :car="dialogData"    :apiType="dialogType" v-model=carDialog anyNumber
                      :eClasses="eClasses" :eIndexes="eIndexes" :eSeries="eSeries" :eDriverId="eDriverId">
        </CarDialog>
        <ConfirmDialog title="Reset Sent" noCancel v-model="resetDialog">Reset email has been sent to {{resetEmail}}</ConfirmDialog>
    </div>
</template>

<script>
import findIndex from 'lodash/findIndex'
import isEmpty from 'lodash/isEmpty'
import { mapState } from 'vuex'
import Vue from 'vue'
import DriverSearchSelect from '../components/DriverSearchSelect.vue'
import DriverEditorDisplay from '../components/DriverEditorDisplay.vue'
import DriverDialog from '@/components/DriverDialog.vue'
import CarDialog from '@/components/CarDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

export default {
    name: 'DriverEditor',
    components: {
        DriverSearchSelect,
        DriverEditorDisplay,
        DriverDialog,
        CarDialog,
        ConfirmDialog
    },
    data() {
        return {
            displayids: {},
            driverbrief: undefined,
            allclassindex: undefined,
            dialogData: undefined,
            resetEmail: '',
            dialogType: '',
            driverDialog: false,
            carDialog: false,
            resetDialog: false,
            eClasses: undefined,
            eIndexes: undefined,
            eSeries: undefined,
            eDriverId: undefined
        }
    },
    computed: {
        ...mapState(['currentSeries', 'drivers', 'cars']),
        selectedCount() {
            return Object.keys(this.displayids).length
        },
        selectedDrivers() {
            return Object.keys(this.displayids).map(did => this.drivers[did]).filter(v => v)
        },
        sizeWarning() {
            return this.$vuetify.breakpoint.width < 950
        }
    },
    methods: {
        addid(driverid) {
            Vue.set(this.displayids, driverid, 1)
            this.$store.dispatch('ensureEditorInfo', [driverid])
        },
        delid(driverid) {
            Vue.delete(this.displayids, driverid)
        },
        removeFromBrief(driverid) {
            this.driverbrief.splice(findIndex(this.driverbrief, d => d.driverid === driverid), 1)
        },
        driverComplete(type, driver) {
            if (type === 'delete') {
                this.removeFromBrief(driver.driverid)
            }
        },
        buttons(name, series, driverid, carid) {
            let oldids = []
            let driver
            this.eSeries = series
            this.eDriverId = driverid
            if (series) {
                this.eClasses = this.allclassindex[series].classes
                this.eIndexes = this.allclassindex[series].indexes
            }

            switch (name) {
                case 'editdriver':
                    this.dialogData = this.drivers[driverid]
                    this.dialogType = 'update'
                    this.driverDialog = true
                    break
                case 'deldriver':
                    this.dialogData = this.drivers[driverid]
                    this.dialogType = 'delete'
                    this.driverDialog = true
                    break
                case 'merge':
                    oldids = Object.keys(this.displayids).filter(did => did !== driverid)
                    if (oldids.length > 0) {
                        this.$store.dispatch('setdata', {
                            type: 'update',
                            items: {
                                merge: {
                                    newid: driverid,
                                    oldids: oldids
                                }
                            }
                        }).then(() => {
                            // special handling as type is update for most things but some drivers are delete
                            for (const did of oldids) {
                                Vue.delete(this.$store.state.drivers, did)
                                this.removeFromBrief(did)
                            }
                        })
                    }
                    break
                case 'reset':
                    driver = this.drivers[driverid]
                    this.$store.dispatch('reset', {
                        firstname: driver.firstname,
                        lastname:  driver.lastname,
                        email:     driver.email,
                        admin:     true
                    }).then(data => {
                        if (data) {
                            this.resetEmail = driver.email
                            this.resetDialog = true
                        }
                    })
                    break
                case 'newcar':
                    this.dialogData = null
                    this.dialogType = 'insert'
                    this.carDialog = true
                    break
                case 'editcar':
                    this.dialogData = this.cars[carid]
                    this.dialogType = 'update'
                    this.carDialog = true
                    break
                case 'delcar':
                    this.dialogData = this.cars[carid]
                    this.dialogType = 'delete'
                    this.carDialog = true
                    break
                default:
                    console.log(name)
            }
        },
        updatedata() {
            if (isEmpty(this.driverbrief) || isEmpty(this.allclassindex)) {
                this.$store.dispatch('getdata', { items: 'driverbrief,allclassindex' }).then(data => {
                    this.driverbrief = data.driverbrief
                    const all = {}
                    for (const [series, clsidx] of Object.entries(data.allclassindex)) {
                        all[series] = { classes: {}, indexes: {}}
                        for (const entry of clsidx.classes) all[series].classes[entry.classcode] = entry
                        for (const entry of clsidx.indexes) all[series].indexes[entry.indexcode] = entry
                    }
                    this.allclassindex = all
                })
            }
        }
    },
    mounted() {
        this.updatedata()
    },
    watch: {
        currentSeries() {
            Object.keys(this.displayids).forEach(k => this.addid(k))
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
