<template>
    <div class='outer'>
        <div v-if="sizeWarning" class='sizewarning'>The display width is less then the recommended minimum 950px for this tool</div>
        <div class='twocol'>
            <DriverSearchSelect @add="addid" @del="delid"></DriverSearchSelect>
            <div class='displaybox'>
                <div v-for="driver in selectedDrivers" :key="driver.driverid" class='driverbox'>
                    <DriverEditorDisplay :driver=driver></DriverEditorDisplay>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import Vue from 'vue'
import DriverSearchSelect from '../components/DriverSearchSelect'
import DriverEditorDisplay from '../components/DriverEditorDisplay'

export default {
    name: 'DriverEditor',
    components: {
        DriverSearchSelect,
        DriverEditorDisplay
    },
    data() {
        return {
            selected: {}
        }
    },
    computed: {
        ...mapState(['drivers']),
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
