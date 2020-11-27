<template>
    <div class='userpanel'>
        <div class='selector'>
            <div class='text'>Filter Class: </div>
            <v-select :items="classcodes" v-model="selectedClass" outlined dense hide-details></v-select>
        </div>
        <v-tabs color="secondary" v-model="selectedTab">
            <v-tab>Prev</v-tab>
            <v-tab>Last</v-tab>
            <v-tab>Next</v-tab>
            <v-tab>Index</v-tab>
            <v-tab>Raw</v-tab>

            <v-tab-item>
                <template v-if="!isEmpty(prev) && !prev.nodata">
                    <EntrantTable :entrant="prev.entrant"></EntrantTable>
                    <ClassTable       :cls="prev.class"></ClassTable>
                    <ChampTable     :champ="prev.champ"></ChampTable>
                </template>
                <template v-else>
                    {{ nodatamsg(prev) }}
                </template>
            </v-tab-item>
            <v-tab-item>
                <template v-if="!isEmpty(last) && !last.nodata">
                    <EntrantTable :entrant="last.entrant"></EntrantTable>
                    <ClassTable       :cls="last.class"></ClassTable>
                    <ChampTable     :champ="last.champ"></ChampTable>
                </template>
                <template v-else>
                    {{ nodatamsg(last) }}
                </template>
            </v-tab-item>
            <v-tab-item>
                <template v-if="!isEmpty(next) && !next.nodata">
                    <EntrantTable :entrant="next.entrant"></EntrantTable>
                    <ClassTable       :cls="next.class"></ClassTable>
                    <ChampTable     :champ="next.champ"></ChampTable>
                </template>
                <template v-else>
                    {{ nodatamsg(next) }}
                </template>
            </v-tab-item>
            <v-tab-item>
                <TopTimesTable v-if="topnet" :tttable="topnet" type="Index"></TopTimesTable>
            </v-tab-item>
            <v-tab-item>
                <TopTimesTable v-if="topraw" :tttable="topraw" type="Raw"></TopTimesTable>
            </v-tab-item>
        </v-tabs>
    </div>
</template>


<script>
import { mapState } from 'vuex'
import isEmpty from 'lodash/isEmpty'

import ClassTable from '../components/live/ClassTable.vue'
import ChampTable from '../components/live/ChampTable.vue'
import EntrantTable from '../components/live/EntrantTable.vue'
import TopTimesTable from '../components/live/TopTimesTable.vue'

export default {
    name: 'UserPanel',
    components: {
        ClassTable,
        ChampTable,
        EntrantTable,
        TopTimesTable
    },
    data() {
        return {
            selectedTab: '',
            isEmpty,
            watch: {
                entrant:  true,
                class:    true,
                champ:    true,
                next:     true,
                classcode: '',
                top: {
                    net:  { 0: true },
                    raw:  { 0: true }
                }
            }
        }
    },
    computed: {
        ...mapState(['classes']),  // mapstate doesn't really work with sub value with dot notation
        prev()      { return this.$store.state.live.prev },
        last()      { return this.$store.state.live.last },
        next()      { return this.$store.state.live.next },
        topraw()    { return this.$store.state.live.topraw },
        topnet()    { return this.$store.state.live.topnet },
        classcodes() { return [{ text: 'All', value: '' }, ...Object.values(this.classes).map(c => c.classcode).sort()] },
        selectedClass: {
            get() { return this.watch.classcode },
            set(nv) {
                this.watch.classcode = nv
                this.$store.dispatch('setWatch', this.watch)
            }
        }
    },
    methods: {
        nodatamsg(data) {
            if (data.nodata) return 'No class data yet'
            return 'Waiting for data'
        }
    },
    watch: {
        last() { this.selectedTab = 1 }
    },
    mounted() {
        this.$store.dispatch('setWatch', this.watch)
    }
}
</script>

<style lang="scss" scoped>
.selector {
    display: flex;
    align-items: baseline;
    column-gap: 1rem;
    margin-top: 0.5rem;
    margin-left: 0.5rem;
    margin-right: 0.5rem;
    .text {
        text-align: right;
        font-weight: bold;
    }
    .v-select {
        flex: 0.5;
    }
}
.userpanel {
    width: 100%;
    font-size: 0.95rem;
}
</style>
