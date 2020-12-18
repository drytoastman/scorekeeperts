<template>
    <div class='outer' v-if="eventid">
        <div class='gridgrid'>
            <div v-for="(group,idx) in report.groups" :key="'grid'+idx">
                <div class='labelgrid'>
                    <div>Grid {{idx}}</div>
                    <div class='small'>First</div>
                    <div class='small'>Dual</div>
                </div>
                <draggable :list="group" group="gridgroup" class='draggable' revertOnSpill=true @change="dragchange">
                    <GridBlock v-for="cw in group" :key="cw.classcode" :classwrapper="cw" ></GridBlock>
                </draggable>
            </div>
            <v-btn color='secondary' dark class='updatebutton' @click='update'>Update</v-btn>
        </div>
        <div v-if="report.groups">
            <div class='links'>
                <a :href='`/results/${currentSeries}/${eventid}/grid`' target="_blank">Results Page Report</a>
            </div>

            <div class='checks'>
                <template v-for="(_,idx) in report.groups">
                    <v-checkbox dense hide-details :key=idx v-model=checks[idx] :label="`Group ${idx}`"></v-checkbox>
                </template>
            </div>
            <template v-for="(group,idx) in report.groups">
                <div v-if="checks[idx] && groupActive(group)" :key="idx" class='gridview'>
                    <GridDisplay :table="report.table(idx, 'firsts')" :grid=idx></GridDisplay>
                    <GridDisplay :table="report.table(idx, 'duals')"  :grid=idx+100></GridDisplay>
                </div>
            </template>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import draggable from 'vuedraggable'
import { createGridReport } from 'sctypes/lib/gridorder'
import GridBlock from './GridBlock.vue'
import GridDisplay from '@/components/GridDisplay.vue'

export default {
    name: 'GridOrder',
    components: {
        draggable,
        GridBlock,
        GridDisplay
    },
    props: {
        eventid: String
    },
    data()  {
        return {
            report: {},
            checks: [true, true, true]
        }
    },
    computed: {
        ...mapState(['currentSeries', 'classes', 'classorder', 'drivers', 'cars', 'registered']),
        newdata() { return [this.classes, this.classorder, this.cars, this.registered] }
    },
    methods: {
        groupActive(group) {
            for (const cw of group) {
                if (cw.firsts.length) return true
            }
            return false
        },
        dragchange(evt) {
            for (const attr of ['added', 'moved']) {
                if (evt[attr]) {
                    evt[attr].element.changed = true
                }
            }
        },
        buildReport() {
            this.report = createGridReport(
                this.classorder.filter(co => co.eventid === this.eventid),
                Object.keys(this.classes),
                this.eventid in this.registered ? this.registered[this.eventid].map(r => this.cars[r.carid]).filter(c => c) : [],
                this.drivers)
        },
        update() {
            this.$store.dispatch('setdata', {
                type: 'upsert',
                items: { classorder: this.report.classorder(this.eventid) }
            })
        }
    },
    watch: {
        newdata() { this.buildReport() }
    },
    mounted() {
        this.buildReport()
        this.$store.dispatch('ensureTablesAndCarDriverInfo', ['registered'])
    }
}
</script>

<style scoped lang="scss">
.outer {
    display: grid;
    grid-template-columns: auto auto;
}
.gridgrid {
    display: grid;
    grid-template-columns: 7rem 7rem 7rem;
    column-gap: 1rem;
    row-gap: 1rem;
    height: 50vh;
}
.links {
    display: flex;
    * {
        flex: 1;
        text-align: center;
    }
}
.checks {
    display: flex;
    width: 100%;
    justify-content: space-around;
    margin-bottom: 0.5rem;
    ::v-deep .v-input {
        margin-top: 0;
        label {
            font-size: 80% !important;
        }
    }
}
.updatebutton {
    grid-column-start: 1;
    grid-column-end: 4;
}
.gridview {
    font-size: 80%;
    margin-bottom: 2rem;
}
.draggable {
    width: 100%;
    height: calc(100% - 2rem);
    border: 1px solid lightgray;
    border-radius: 2px;
}
.labelgrid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    align-items: baseline;
    margin: 0 0.5rem 0.2rem 0.5rem;
    .small {
        font-size: 70%;
    }
}
</style>
