<template>
    <div class='outer'>
        <div class='col1'>
            <TimerBox :timer="timer"></TimerBox>
            <RunOrderTable :order="runorder"></RunOrderTable>

            <div id='classtabs'>
                <v-tabs color="secondary" v-model="selectedTab">
                    <v-tab>2nd Last</v-tab>
                    <v-tab>Last</v-tab>
                    <v-tab>Next</v-tab>
                    <v-tab>By Class</v-tab>

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
                        <ClassSelector v-model="selectedClass"></ClassSelector>
                        <template v-if="!isEmpty(lastclass) && !lastclass.nodata">
                            <EntrantTable :entrant="lastclass.entrant"></EntrantTable>
                            <ClassTable       :cls="lastclass.class"></ClassTable>
                            <ChampTable     :champ="lastclass.champ"></ChampTable>
                        </template>
                        <template v-else>
                            {{ nodatamsg(lastclass) }}
                        </template>
                    </v-tab-item>
                </v-tabs>
            </div>
        </div>

        <div class='col2'>
            <div id='tttabs'>
                <v-tabs color="secondary" v-model="selectedTTab">
                    <v-tab>Index</v-tab>
                    <v-tab>Raw</v-tab>

                    <v-tab-item>
                        <TopTimesTable :tttable="topnet" type="Index"></TopTimesTable>
                    </v-tab-item>
                    <v-tab-item>
                        <TopTimesTable :tttable="topraw" type="Raw"></TopTimesTable>
                    </v-tab-item>
                </v-tabs>
            </div>
        </div>
    </div>
</template>


<script>
import isEmpty from 'lodash/isEmpty'

import TimerBox from '../components/live/TimerBox.vue'
import RunOrderTable from '../components/live/RunOrderTable.vue'
import ClassTable from '../components/live/ClassTable.vue'
import ChampTable from '../components/live/ChampTable.vue'
import EntrantTable from '../components/live/EntrantTable.vue'
import TopTimesTable from '../components/live/TopTimesTable.vue'
import ClassSelector from '../components/live/ClassSelector.vue'

export default {
    name: 'AnnouncerPanel',
    components: {
        TimerBox,
        RunOrderTable,
        ClassTable,
        ChampTable,
        EntrantTable,
        TopTimesTable,
        ClassSelector
    },
    data() {
        return {
            selectedTab: '',
            selectedTTab: '',
            isEmpty
        }
    },
    computed: {
        prev()      { return this.$store.state.live.prev },
        last()      { return this.$store.state.live.last },
        next()      { return this.$store.state.live.next },
        lastclass() { return this.$store.state.live.lastclass },
        runorder()  { return this.$store.state.live.runorder },
        timer()     { return this.$store.state.live.timer },
        topraw()    { return this.$store.state.live.topraw },
        topnet()    { return this.$store.state.live.topnet },
        selectedClass: {
            get() { return this.$store.state.live.getclass },
            set(nv) { this.$store.dispatch('setClass', nv) }
        }
    },
    methods: {
        nodatamsg(data) {
            if (data && data.nodata) return 'No class data yet'
            return 'Waiting for data'
        }
    },
    watch: {
        last() { this.selectedTab = 1 }
    },
    mounted() {
        this.$store.dispatch('setWatch', {
            timer:    true,
            runorder: true,
            entrant:  true,
            class:    true,
            champ:    true,
            next:     true,
            top: {
                net:  { 0: true },
                raw:  { 0: true }
            }
        })
    }
}
</script>

<style lang="scss" scoped>
    .outer {
        display: flex;
        width: 100%;
        font-size: 0.95rem;
    }
    .col1 {
        flex: 0.75;
    }
    .col2 {
        flex: 0.25;
    }
</style>
