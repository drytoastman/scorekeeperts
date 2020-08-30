<template>
    <div class='outer' v-if="eventid">
        <div class='gridgrid'>
            <div v-for="(group,idx) in report.groups" :key="'grid'+idx">
                <div class='labelgrid'>
                    <div>Grid {{idx}}</div>
                    <div class='small'>First</div>
                    <div class='small'>Dual</div>
                </div>
                <draggable :list="group" group="gridgroup" class='draggable' revertOnSpill=true @change="update">
                    <GridBlock v-for="cw in group" :key="cw.classcode" :classwrapper="cw" ></GridBlock>
                </draggable>
            </div>
        </div>
        <div v-if="report.groups">
            <template v-for="(group,idx) in report.groups">
                <GridDisplay :key="idx"     :table="report.table(idx, 'firsts')" :grid=idx></GridDisplay>
                <GridDisplay :key="idx+100" :table="report.table(idx, 'duals')"  :grid=idx+100></GridDisplay>
            </template>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import draggable from 'vuedraggable'
import { createGridReport } from '@/common/gridorder'
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
            report: {}
        }
    },
    computed: {
        ...mapState(['classes', 'classorder', 'drivers', 'cars', 'registered']),
        newdata() { return [this.classes, this.classorder, this.cars, this.registered] }
    },
    methods: {
        update(evt) {
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
    grid-template-columns: 1fr 1fr;
}
.gridgrid {
    display: grid;
    grid-template-columns: 8rem 8rem 8rem;
    column-gap: 1rem;
}
.draggable {
    width: 100%;
    height: 100%;
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
