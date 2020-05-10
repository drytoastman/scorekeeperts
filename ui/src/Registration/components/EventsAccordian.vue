<template>
    <div>
    <v-expansion-panels multiple focusable hover accordion tile>
        <v-expansion-panel v-for="event in orderedEvents" :key="event.eventid">
            <v-expansion-panel-header class='elevation-4'>
                <v-container class="pa-0">
                    <v-row no-gutters align=center class='eventrow'>
                        <v-col class='datecol'>
                            <span class='eventdate'>{{event.date | titledate}}</span>
                        </v-col>
                        <v-col class='namecol'>
                            <span class='eventname'>{{event.name}}</span>
                        </v-col>
                        <v-spacer></v-spacer>
                    </v-row>
                </v-container>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
                <RegisterEventDisplay :event="event" @regrequest="regrequest(event)"></RegisterEventDisplay>
            </v-expansion-panel-content>
        </v-expansion-panel>
    </v-expansion-panels>
    <RegDialog v-model=dialogOpen :event=dialogEvent></RegDialog>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import _ from 'lodash'
import RegDialog from './RegDialog'
import RegisterEventDisplay from '../components/RegisterEventDisplay.vue'

export default {
    components: {
        RegisterEventDisplay,
        RegDialog
    },
    data: () => ({
        dialogOpen: false,
        dialogEvent: null
    }),
    filters: {
        titledate: function(v) { return new Date(v).toDateString() }
    },
    computed: {
        ...mapState(['series', 'events', 'counts', 'registered']),
        orderedEvents() { return _.orderBy(this.events, ['date']) }
    },
    methods: {
        regrequest: function(event) {
            this.dialogEvent = event
            this.dialogOpen = true
        }
    }
}
</script>

<style scoped>
    .eventdate, .eventname {
        font-size: 1.2rem;
        white-space: nowrap;
    }
    .eventdate {
        font-weight: bold;
    }
    .datecol {
        text-align: right;
        margin-right: 0.5rem;
        max-width: 10rem;
    }
    .datecol, .namecol {
        flex-grow: 0.5;
    }

    @media (max-width: 700px) {
        .eventrow {
            display: block;
        }
        .datecol, .namecol {
            text-align: left;
        }
        .datecol {
            margin-bottom: 5px;
        }
    }

    /* .v-expansion-panel-header--active */
    .v-expansion-panel-header:hover {
        background: gray;
        color: white;
    }
</style>
