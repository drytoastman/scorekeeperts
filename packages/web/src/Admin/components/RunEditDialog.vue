<template>
    <v-dialog :value="value" @input="$emit('input')" persistent max-width="600px">
        <v-card>
            <v-card-title>
                <span class="headline primary--text">Edit Runs</span>
            </v-card-title>
            <v-card-text>

                <div class='desc' v-if="driver">
                    <div>
                        <h2>{{driver.firstname}} {{driver.lastname}}</h2>
                        {{driver.driverid}}
                    </div>
                    <CarLabel :car="data">{{data.carid}}</CarLabel>
                </div>

                <v-progress-linear :active="!!gettingData" indeterminate absolute color="green accent-4"></v-progress-linear>
                <v-data-table :items="runs" :headers="headers" item-key="run" dense
                                disable-pagination disable-sort hide-default-footer>

                    <template v-slot:[`item.raw`]="props">
                        <v-text-field v-model="props.item.raw" :rules="drules" single-line class='raw'></v-text-field>
                    </template>
                    <template v-slot:[`item.cones`]="props">
                        <v-text-field v-model="props.item.cones" :rules="irules" single-line class='int'></v-text-field>
                    </template>
                    <template v-slot:[`item.gates`]="props">
                        <v-text-field v-model="props.item.gates" :rules="irules" single-line class='int'></v-text-field>
                    </template>
                    <template v-slot:[`item.status`]="props">
                        <v-select :items="['OK', 'DNF', 'DNS', 'RL', 'NS']" v-model="props.item.status" class='stat'></v-select>
                    </template>
                </v-data-table>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary darken-2" text @click="$emit('input')">Cancel</v-btn>
                <v-btn color="primary darken-2" text @click="updateRuns">Ok</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import orderBy from 'lodash/orderBy'
import isEqual from 'lodash/isEqual'
import uniqWith from 'lodash/uniqWith'
import { mapState } from 'vuex'
import { isDecimal3 } from 'sctypes/util'
import CarLabel from '@/components/CarLabel.vue'

export default {
    name: 'RunEditDialog',
    components: {
        CarLabel
    },
    props: {
        value: Boolean,
        data: Object
    },
    data() {
        return {
            drules: [isDecimal3],
            irules: [v => v >= 0 || '>= 0'],
            headers: [
                { text: 'Course', value: 'course',   align: 'center' },
                { text: 'Group',  value: 'rungroup', align: 'center' },
                { text: 'Run',    value: 'run',      align: 'center' },
                { text: 'Raw',    value: 'raw',      align: 'center' },
                { text: 'C',      value: 'cones',    align: 'center' },
                { text: 'G',      value: 'gates',    align: 'center' },
                { text: 'Status', value: 'status',   align: 'center' }
            ],
            runs: []
        }
    },
    computed: {
        ...mapState(['drivers', 'events', 'gettingData']),
        event() { return this.events[this.data.eventid] },
        driver() { return this.drivers[this.data.driverid] }
    },
    methods: {
        updateRuns() {
            this.$store.dispatch('setdata', {
                items: {
                    runs: this.runs
                }
            }).then(data => {
                if (data && data.runs) this.$emit('input')
            })
        },
        getRuns() {
            this.$store.dispatch('getdata', {
                items: 'runs',
                eventid: this.data.eventid,
                carid: this.data.carid
            }).then(data => {
                if (data) {
                    // fill out any missing runs with blank data
                    const keys = uniqWith(data.runs.map(r => [r.course, r.rungroup]), isEqual)
                    for (const [c, g] of keys) {
                        const runs = data.runs.filter(r => r.course === c && r.rungroup === g).map(r => r.run)
                        for (let ii = 1; ii <= this.event.runs; ii++) {
                            if (!runs.includes(ii)) {
                                data.runs.push({
                                    eventid: this.data.eventid,
                                    carid: this.data.carid,
                                    course: c,
                                    rungroup: g,
                                    run: ii,
                                    raw: 999.999,
                                    cones: 0,
                                    gates: 0,
                                    status: 'DNS'
                                })
                            }
                        }
                    }

                    this.runs = orderBy(data.runs, ['course', 'rungroup', 'run'])
                }
            })
        }
    },
    watch: {
        value: function(newv) {
            if (newv) {
                this.runs = []
                this.getRuns()
            }
        }
    }
}
</script>

<style lang='scss' scoped>
.desc {
    display: flex;
    align-items: flex-end;
    column-gap: 2rem;
    white-space: nowrap;
}
::v-deep {
    .v-input {
        padding-top: 0;
    }
    .v-text-field__details {
        min-height: 0;
        .v-messages {
            min-height: 0;
        }
    }
}
.raw {
    max-width: 5rem;
    ::v-deep input {
        text-align: right;
        padding-right: 5px;
    }
}
.int {
    max-width: 3rem;
    ::v-deep {
        input {
            text-align: center;
        }
    }
}
.stat {
    max-width: 5rem;
    ::v-deep .v-select__selection {
        flex-grow: 1;
        text-align: right;
    }
}
</style>
