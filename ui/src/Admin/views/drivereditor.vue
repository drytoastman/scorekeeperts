<template>
    <div class='outer'>
        <div class='searchbox'>
            <v-text-field v-model="search" dense placeholder="search" class='searchfield'></v-text-field>
            <div class='namelist'>
                <table class='nametable'>
                    <tr v-for="d in searched" :key="d.driverid" @click="trclick($event, d.driverid)">
                        <td>{{d.firstname|lenlimit(12)}}</td>
                        <td>{{d.lastname|lenlimit(16)}}</td>
                        <td>{{d.email|lenlimit(20)}}</td>
                    </tr>
                </table>
            </div>
        </div>
        <div class='displaybox'>
            <div v-for="driver in selectedDrivers" :key="driver.driverid" class='driverbox'>
                <div class='buttons'>
                    <v-btn color=secondary outlined small>Edit</v-btn>
                    <v-btn color=secondary outlined small>Delete</v-btn>
                    <v-btn color=secondary outlined small>Merge Into This</v-btn>
                    <v-btn color=secondary outlined small :disabled="!driver.email">Send Password Reset</v-btn>
                </div>
                <Driver :driver=driver class='driverinfo'></Driver>
                <CarLabel v-for="car in drivercars(driver.driverid)" :key="car.carid" :car=car>
                    <div>{{car.series}}</div>
                    <div class='smallbuttons'>
                        <v-btn color=secondary outlined small>Edit</v-btn>
                        <v-btn color=secondary outlined small>Delete</v-btn>
                    </div>
                </CarLabel>
            </div>
        </div>
    </div>
</template>

<script>
import isEmpty from 'lodash/isEmpty'
import { mapState } from 'vuex'
import Vue from 'vue'
import Driver from '../../components/Driver'
import CarLabel from '../../components/CarLabel'

export default {
    name: 'DriverEditor',
    components: {
        Driver,
        CarLabel
    },
    data() {
        return {
            search: '',
            selected: {}
        }
    },
    computed: {
        ...mapState(['drivers', 'driverbrief', 'cars']),
        searched() {
            if (!this.search) return this.driverbrief
            const reg = this.search.split(' ').map(t => new RegExp(t, 'i'))
            return this.driverbrief.filter(d => {
                for (const r of reg) {
                    if (!(r.test(d.firstname) || r.test(d.lastname) || r.test(d.email))) return false
                }
                return true
            })
        },
        selectedDrivers() {
            return Object.keys(this.selected).map(did => this.drivers[did]).filter(v => v)
        }
    },
    methods: {
        trclick(event, driverid) {
            const trelement = event.target.parentElement // clicks return td

            if (driverid in this.selected) {
                this.unselect(driverid)
            } else {
                if (event.getModifierState('Shift')) {
                    // select all between?  TBD, FINISH ME
                } else if (event.getModifierState('Control')) {
                    // individual select of new value
                    this.select(driverid, trelement)
                } else {
                    // unselect others
                    for (const did of Object.keys(this.selected)) {
                        this.unselect(did)
                    }
                    this.select(driverid, trelement)
                }
            }
        },
        unselect(driverid) {
            this.selected[driverid].classList.remove('selected')
            Vue.delete(this.selected, driverid)
        },
        select(driverid, trelement) {
            trelement.classList.add('selected')
            Vue.set(this.selected, driverid, trelement)
            this.$store.dispatch('ensureEditorInfo', [driverid])
        },
        drivercars(driverid) {
            return Object.values(this.cars).filter(c => c.driverid === driverid)
        }
    },
    mounted() {
        if (isEmpty(this.driverbrief)) {
            this.$store.dispatch('getdata', { items: 'driverbrief' })
        }
    }
}
</script>

<style lang="scss" scoped>
.outer {
    display: flex;
    column-gap: 1rem;
}
.searchbox {
    display: flex;
    flex-direction: column;
    .searchfield {
        flex-grow: 0;
    }
    .namelist {
        flex-grow: 1;
        height: 80vh;
        width: 45vw;
        overflow: scroll;
    }
    .nametable {
        border-collapse: collapse;
        width: 100%;

        tr.selected {
            background-color: rgba(0,150,0,0.25) !important;
        }
        tr:nth-of-type(2n+1) {
            background-color: rgba(0,0,0,0.05);
        }
        td {
            padding: 2px 10px 2px 3px;
            border: 1px solid lightgray;
            font-size: 80%;
            cursor: pointer;
            user-select: none;
        }
    }
}
.displaybox {
    .driverbox {
        margin-bottom: 1rem;
        .buttons {
            display: grid;
            grid-template-columns: repeat(4, auto);
            column-gap: 5px;
        }
        .smallbuttons {
            display: flex;
            column-gap: 5px;
            .v-btn {
                height: 22px;
            }
        }
    }
    ::v-deep {
        .driverid {
            white-space: nowrap;
        }
        .barcodescca, .csz {
            padding-bottom: 0;
            margin-bottom: 0;
            border-bottom: none;
        }
    }
}

</style>
