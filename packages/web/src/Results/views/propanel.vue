<template>
    <div class='outer'>
        <div class='colleft'>
            <ProTimerBox   :timerdata="lefttimer"></ProTimerBox>
            <RunOrderTable :order="leftorder"></RunOrderTable>
            <EntrantTable  :entrant="leftentrant"></EntrantTable>
        </div>

        <div class='colcenter'>
            <div id='classtabs'>
                <v-tabs color="secondary" v-model="selectedTab">
                    <v-tab>Last</v-tab>
                    <v-tab>By Class</v-tab>
                    <v-tab>Index</v-tab>
                    <v-tab>Raw</v-tab>

                    <v-tab-item>
                        <template v-if="!isEmpty(last) && !last.nodata">
                            <ClassTable       :cls="last.class"></ClassTable>
                            <ChampTable     :champ="last.champ"></ChampTable>
                        </template>
                        <template v-else>
                            {{ nodatamsg(last) }}
                        </template>
                    </v-tab-item>
                    <v-tab-item>
                        <ClassSelector v-model="selectedClass" :classcodes="classcodes"></ClassSelector>
                        <template v-if="!isEmpty(lastclass) && !lastclass.nodata">
                            <ClassTable       :cls="lastclass.class"></ClassTable>
                            <ChampTable     :champ="lastclass.champ"></ChampTable>
                        </template>
                        <template v-else>
                            {{ nodatamsg(lastclass) }}
                        </template>
                    </v-tab-item>
                    <v-tab-item>
                        <TopTimesTable :tttable="topnet" type="Index"></TopTimesTable>
                    </v-tab-item>
                    <v-tab-item>
                        <TopTimesTable :tttable="topraw" type="Raw"></TopTimesTable>
                    </v-tab-item>
                </v-tabs>
            </div>
        </div>

        <div class='colright'>
            <ProTimerBox   :timerdata="righttimer"></ProTimerBox>
            <RunOrderTable :order="rightorder"></RunOrderTable>
            <EntrantTable  :entrant="rightentrant"></EntrantTable>
        </div>
    </div>
</template>


<script>
import isEmpty from 'lodash/isEmpty'

import ProTimerBox from '../components/live/ProTimerBox.vue'
import RunOrderTable from '../components/live/RunOrderTable.vue'
import ClassTable from '../components/live/ClassTable.vue'
import ChampTable from '../components/live/ChampTable.vue'
import EntrantTable from '../components/live/EntrantTable.vue'
import TopTimesTable from '../components/live/TopTimesTable.vue'
import ClassSelector from '../components/live/ClassSelector.vue'

export default {
    name: 'ProPanel',
    components: {
        ProTimerBox,
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
        classcodes() { return this.$store.state.classcodes },
        last()       { return this.$store.state.live.last },
        lastclass()  { return this.$store.state.live.lastclass },
        leftentrant()  { return this.$store.state.live.left?.entrant },
        rightentrant() { return this.$store.state.live.right?.entrant },
        leftorder()  { return this.$store.state.live.leftorder },
        rightorder() { return this.$store.state.live.rightorder },
        lefttimer()  { return this.$store.state.live.lefttimer },
        righttimer() { return this.$store.state.live.righttimer },
        topraw()     { return this.$store.state.live.topraw },
        topnet()     { return this.$store.state.live.topnet },
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
        last() { this.selectedTab = 0 }
    },
    mounted() {
        this.$store.dispatch('setWatch', {
            protimer: true,
            runorder: true,
            entrant:  true,
            class:    true,
            champ:    true,
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
    display: grid;
    width: 100%;
    font-size: 0.95rem;
    grid-template-columns: repeat(3, 1fr);
}
</style>
