<template>
    <div>
        <template v-for="[idx, tables] in Object.entries(gridtables)">
            <div v-if="tables.firsts.length" :key="idx" class='gridview'>
                <GridDisplay :table="tables.firsts" :grid='parseInt(idx)'></GridDisplay>
                <GridDisplay :table="tables.duals"  :grid='parseInt(idx)+100'></GridDisplay>
            </div>
        </template>
    </div>
</template>

<script>
import GridDisplay from '@/components/GridDisplay.vue'

export default {
    name: 'GridView',
    components: {
        GridDisplay
    },
    props: {
        query: Object,
        eventid: String
    },
    data()  {
        return {
            gridtables: {}
        }
    },
    methods: {
        getdata() {
            this.$store.dispatch('getdata', { items: 'gridtables', eventid: this.eventid }).then(res => {
                if (res) this.gridtables = res.gridtables
            })
        }
    },
    watch: {
        eventid(nv) { if (nv) this.getdata() }
    },
    mounted() {
        this.getdata()
    }
}
</script>

<style lang="scss" scoped>
.gridview {
    page-break-after: always;
}
::v-deep .griddisplay {
    margin-bottom: 1rem;
}
</style>
