<template>
    <div class='outer' v-if="eventid">
        <div class='gridgrid'>
            <div v-for="(grid,idx) in grids" :key="'grid'+idx">
                Grid {{idx}}
                <draggable :list="grid" group="gridgroup" class='draggable' revertOnSpill=true>
                    <div v-for="element in grid" class='element' :key="element">{{element}}</div>
                </draggable>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import draggable from 'vuedraggable'

export default {
    name: 'GridOrder',
    components: {
        draggable
    },
    props: {
        eventid: String
    },
    data()  {
        return {
        }
    },
    computed: {
        ...mapState(['classes', 'classorder', 'registered']),
        grids() {
            const ret = [[], [], []]
            for (const co of this.classorder.filter(co => co.eventid === this.eventid)) {
                ret[co.rungroup] = co.classes
            }
            ret[0] = Object.values(this.classes).map(c => c.classcode).filter(c => c !== 'HOLD' && !ret[1].includes(c) && !ret[2].includes(c))
            return ret
        }
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
.element {
    font-size: 90%;
    border: 1px solid grey;
    border-radius: 5px;
    background: #EEEA;
    color: #333;
    margin: 0.5rem;
    padding: 0.5rem;
}
</style>
