<template>
    <div class='outer'>
        <div class='col1'>
            <TimerBox :timer="timer"></TimerBox>
            <RunOrderTable :order="runorder"></RunOrderTable>

            <div id='classtabs'>
                <v-tabs color="secondary" @changed="tabchange">
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
                        <template v-if="!isEmpty(lastclass)">
                            <EntrantTable :entrant="lastclass.entrant"></EntrantTable>
                            <ClassTable       :cls="lastclass.class"></ClassTable>
                            <ChampTable     :champ="lastclass.champ"></ChampTable>
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
                <v-tabs color="secondary" @changed="tabchange">
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

import { UUID } from '@/common/util'
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
    props: {
        series: String,
        eventid: UUID
    },
    data() {
        return {
            lastclass: {},
            tselected: 0,
            classcodes: ['Off', 'A', 'B', 'C'],
            selectedClass: '',
            isEmpty
        }
    },
    computed: {
        ...mapState(['prev', 'last', 'next', 'topnet', 'topraw', 'timer', 'runorder'])
    },
    methods: {
        tabchange() {
            return ''
        },
        updateRequest() {
            /* */
        }
    }
    /*
    nothing() {

    },

    classChange(e) {
        var idx = e.target.selected
        var code = e.target.children[idx].textContent

        if (code === 'Off') {
            if (this.classData != null) {
                this.classData.shutdown()
                this.classData = null
            }
            this.lastclass = null
            return
        }

        var me = this
        if (this.classData == null) {
            this.classData = new DataSource(
                panelConfig.wsurl,
                (d) => { if ('last' in d) me.lastclass = d.last }
            )
        }

        this.lastclass = null
        this.classData.request({
            watch: {
                series:  panelConfig.series,
                eventid: panelConfig.eventid,
                classcode: code,
                entrant: true,
                class:   true,
                champ:   true
            }
        })
    }
    */
}
</script>

<style lang="scss" scoped>
    .outer {
        display: flex;
        width: 100%;
    }

    .col1 {
        flex-grow: 1;
    }

    .timer-box, .runorder-table {
        display: block;
        width: 100%;
    }

    .panel {
        display: flex;
        flex-wrap: wrap;
    }

    .panel * {
        margin: 2px;
        flex-grow: 1;
    }
</style>
