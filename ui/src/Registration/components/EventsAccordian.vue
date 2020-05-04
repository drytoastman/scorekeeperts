<template>
    <div>
    <v-expansion-panels multiple focusable hover accordion tile>
        <v-expansion-panel v-for="event in events" :key="event.eventid">
            <v-expansion-panel-header class='elevation-4'>
                <v-container class="pa-0">
                    <v-row no-gutters justify="start">
                        <v-col cols=12 md=3 class='datecol'>
                            <span class='eventdate'>{{event.date | titledate}}</span>
                        </v-col>
                        <v-col cols=12 md=9 class='namecol'>
                            <span class='eventname'> {{event.name}}</span>
                        </v-col>
                    </v-row>
                </v-container>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
                <RegisterEventDisplay :event="event" :counts="counts[event.eventid]"></RegisterEventDisplay>
            </v-expansion-panel-content>
        </v-expansion-panel>
    </v-expansion-panels>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import RegisterEventDisplay from '../components/RegisterEventDisplay.vue'

export default {
    components: {
        RegisterEventDisplay
    },
    filters: {
        titledate: function(v) { return new Date(v).toDateString() }
    },
    computed: {
        ...mapState(['events', 'counts'])
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
    @media (max-width: 960px) {
        .namecol {
            padding-top: 5px;
        }
    }

    /* .v-expansion-panel-header--active */
    .v-expansion-panel-header:hover {
        background: gray;
        color: white;
    }
</style>
