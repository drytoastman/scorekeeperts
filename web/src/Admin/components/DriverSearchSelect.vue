<template>
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
</template>

<script>
import Vue from 'vue'

export default {
    name: 'DriverSearchSelect',
    props: {
        driverbrief: Array
    },
    data() {
        return {
            search: '',
            selected: {}
        }
    },
    computed: {
        searched() {
            if (!this.search) return this.driverbrief
            const reg = this.search.split(' ').map(t => new RegExp(t, 'i'))
            return this.driverbrief.filter(d => {
                for (const r of reg) {
                    if (!(r.test(d.firstname) || r.test(d.lastname) || r.test(d.email))) return false
                }
                return true
            })
        }
    },
    methods: {
        trclick(event, driverid) {
            const trelement = event.target.parentElement // clicks return td
            if (driverid in this.selected) {
                this.unselect(driverid)
            } else {
                if (event.getModifierState('Shift')) {          // select all between?  TBD, FINISH ME
                } else if (event.getModifierState('Control')) { // individual select of new value
                    this.select(driverid, trelement)
                } else {                                        // unselect others
                    Object.keys(this.selected).forEach(did => this.unselect(did))
                    this.select(driverid, trelement)
                }
            }
        },
        unselect(driverid) {
            this.selected[driverid].classList.remove('selected')
            Vue.delete(this.selected, driverid)
            this.$emit('del', driverid)
        },
        select(driverid, trelement) {
            trelement.classList.add('selected')
            Vue.set(this.selected, driverid, trelement)
            this.$emit('add', driverid)
        }
    }
}
</script>

<style lang="scss" scoped>
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
</style>
