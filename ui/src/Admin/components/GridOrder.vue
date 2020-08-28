<template>
    <div class='outer' v-if="eventid">
        <div class='gridgrid'>
            <div v-for="(grid,idx) in grids" :key="'grid'+idx">
                <div class='labelgrid'>
                    <div>Grid {{idx}}</div>
                    <div class='small'>First</div>
                    <div class='small'>Dual</div>
                </div>
                <draggable :list="grid" group="gridgroup" class='draggable' revertOnSpill=true @change="update">
                    <GridBlock v-for="obj in grid" :key="obj.classcode" :obj="obj" ></GridBlock>
                </draggable>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import draggable from 'vuedraggable'
import GridBlock from './GridBlock'

export default {
    name: 'GridOrder',
    components: {
        draggable,
        GridBlock
    },
    props: {
        eventid: String
    },
    data()  {
        return {
            grids: []
        }
    },
    computed: {
        ...mapState(['classes', 'classorder', 'cars', 'registered']),
        multiwatch() { return [this.classes, this.classorder, this.cars, this.registered] }
    },
    methods: {
        update(evt) {
            for (const attr of ['added', 'removed', 'moved']) {
                if (evt[attr]) { evt[attr].element.changed = true }
            }
        },
        buildGrids() {
            const ret = [[], [], []]
            const rem = new Set(Object.keys(this.classes).filter(k => k !== 'HOLD'))

            for (const co of this.classorder.filter(co => co.eventid === this.eventid)) {
                for (const code of co.classes) {
                    ret[co.rungroup].push(this.buildBlock(code))
                    rem.delete(code)
                }
            }
            for (const code of rem) {
                ret[0].push(this.buildBlock(code))
            }
            this.grids = ret
        },
        buildBlock(code) {
            let cars = []
            if (this.eventid in this.registered) {
                cars = this.registered[this.eventid].map(r => r ? this.cars[r.carid] : []).filter(c => c && c.classcode === code)
            }
            return {
                classcode: code,
                firsts: cars.filter(c => c.number < 100).length,
                seconds: cars.filter(c => c.number >= 100).length,
                changed: false
            }
        }
    },
    watch: {
        multiwatch() { console.log('build'); this.buildGrids() }
    },
    mounted() {
        this.buildGrids()
        this.$store.dispatch('ensureTablesAndCarDriverInfo', ['registered'])
    }
}
</script>

<style scoped lang="scss">
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
