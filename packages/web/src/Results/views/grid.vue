<template>
    <div>
        <v-switch v-model="shownet" inset label="Order By Net"></v-switch>
        <template v-for="[idx, tables] in Object.entries(shownet ? byposition : bynumber)">
            <div v-if="tables.firsts.length" :key="idx" class='gridview'>
                <GridDisplay :table="tables.firsts" :grid='parseInt(idx)' :shownet=shownet></GridDisplay>
                <GridDisplay :table="tables.duals"  :grid='parseInt(idx)+100' :shownet=shownet></GridDisplay>
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
        eventslug: String
    },
    data()  {
        return {
            bynumber: {},
            byposition: {},
            shownet: false
        }
    },
    methods: {
        getdata() {
            const eventid = this.$store.getters.eventInfo(this.eventslug).eventid || this.eventslug
            this.$store.dispatch('getdata', { items: 'gridtables', eventid: eventid }).then(res => {
                if (res) this.bynumber = res.gridtables
            })
            this.$store.dispatch('getdata', { items: 'gridtables', eventid: eventid, order: 'position' }).then(res => {
                if (res) this.byposition = res.gridtables
            })
        }
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
@media print {
    .v-input--switch {
        display: none;
    }
}
</style>
