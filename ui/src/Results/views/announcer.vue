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
                        <template v-if="!isEmpty(prev)">
                            <EntrantTable :entrant="prev.entrant"></EntrantTable>
                            <ClassTable       :cls="prev.class"></ClassTable>
                            <ChampTable     :champ="prev.champ"></ChampTable>
                        </template>
                        <template v-else>
                            Waiting for data...
                        </template>
                    </v-tab-item>
                    <v-tab-item>
                        <template v-if="!isEmpty(last)">
                            <EntrantTable :entrant="last.entrant"></EntrantTable>
                            <ClassTable       :cls="last.class"></ClassTable>
                            <ChampTable     :champ="last.champ"></ChampTable>
                        </template>
                        <template v-else>
                            Waiting for data...
                        </template>
                    </v-tab-item>
                    <v-tab-item>
                        <template v-if="!isEmpty(next)">
                            <EntrantTable :entrant="next.entrant"></EntrantTable>
                            <ClassTable       :cls="next.class"></ClassTable>
                            <ChampTable     :champ="next.champ"></ChampTable>
                        </template>
                        <template v-else>
                            Waiting for data...
                        </template>
                    </v-tab-item>
                    <v-tab-item>
                        <v-select :items="classcodes" v-model="selectedClass"></v-select>
                        <template v-if="!isEmpty(lastclass) && !lastclass.nodata">
                            <EntrantTable :entrant="lastclass.entrant"></EntrantTable>
                            <ClassTable       :cls="lastclass.class"></ClassTable>
                            <ChampTable     :champ="lastclass.champ"></ChampTable>
                        </template>
                        <template v-else-if="!isEmpty(lastclass)">
                            No class data yet
                        </template>
                        <template v-else>
                            Waiting for data...
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
import { mapState } from 'vuex'
import isEmpty from 'lodash/isEmpty'

import TimerBox from '../components/TimerBox.vue'
import RunOrderTable from '../components/RunOrderTable.vue'
import ClassTable from '../components/ClassTable.vue'
import ChampTable from '../components/ChampTable.vue'
import EntrantTable from '../components/EntrantTable.vue'
import TopTimesTable from '../components/TopTimesTable.vue'


export default {
    name: 'AnnouncerPanel',
    components: {
        TimerBox,
        RunOrderTable,
        ClassTable,
        ChampTable,
        EntrantTable,
        TopTimesTable
    },
    data() {
        return {
            selectedTab: '',
            selectedTTab: '',
            isEmpty
        }
    },
    computed: {
        ...mapState(['classes']),  // mapstate doesn't really work with sub value with dot notation
        prev()      { return this.$store.state.live.prev },
        last()      { return this.$store.state.live.last },
        next()      { return this.$store.state.live.next },
        lastclass() { return this.$store.state.live.lastclass },
        runorder()  { return this.$store.state.live.runorder },
        timer()     { return this.$store.state.live.timer },
        topraw()    { return this.$store.state.live.topraw },
        topnet()    { return this.$store.state.live.topnet },
        classcodes() { return Object.values(this.classes).map(c => c.classcode).sort() },
        selectedClass: {
            get() { return this.$store.state.live.getclass },
            set(nv) { this.$store.dispatch('setClass', nv) }
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
            classcode: '',
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
    }
    .col1 {
        flex: 0.75;
    }
    .col2 {
        flex: 0.25;
    }
</style>
