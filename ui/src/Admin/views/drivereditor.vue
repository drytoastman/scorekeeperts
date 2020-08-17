<template>
    <div class='outer'>
        <div class='searchbox'>
            <v-text-field v-model="search" dense placeholder="search" class='searchfield'></v-text-field>
            <div class='namelist'>
                <table class='nametable'>
                    <tr v-for="d in searched" :key="d.driverid" @click="trclick($event, d.driverid)">
                        <td>{{d.firstname}}</td>
                        <td>{{d.lastname}}</td>
                        <td>{{d.email}}</td>
                    </tr>
                </table>
            </div>
        </div>
        <div class='displaybox'>
            <div v-for="driver in selectedDrivers" :key="driver.driverid">
                {{driver}}
            </div>
            Display Here
        </div>
    </div>
</template>

<script>
import isEmpty from 'lodash/isEmpty'
import { mapState } from 'vuex'
import Vue from 'vue'

export default {
    name: 'DriverEditor',
    data() {
        return {
            search: '',
            selected: {}
        }
    },
    computed: {
        ...mapState(['drivers', 'driverbrief']),
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
            return Object.keys(this.selected).map(did => this.drivers[did])
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
            this.$store.dispatch('ensureDriverInfo', [driverid])
        }
    },
    watch: {
        selected() {
            console.log('selected changed')
        }
    },
    mounted() {
        if (isEmpty(this.driverbrief)) {
            this.$store.dispatch('getdata', { items: 'driverbrief' })
        }
    }
}
</script>

<style scoped>
.outer {
    display: flex;
    column-gap: 1rem;
}
.searchbox {
    display: flex;
    flex-direction: column;
}
.displaybox {
    min-width: 10rem;
}
.searchfield {
    flex-grow: 0;
}
.namelist {
    flex-grow: 1;
}
.nametable {
    border-collapse: collapse;
    width: 100%;
}
.nametable tr.selected {
    background-color: rgba(0,150,0,0.25) !important;
}
.nametable tr:nth-of-type(2n+1) {
    background-color: rgba(0,0,0,0.05);
}
.nametable td {
    padding: 2px 10px 2px 3px;
    border: 1px solid lightgray;
    font-size: 80%;
    cursor: pointer;
    user-select: none;
}
</style>
