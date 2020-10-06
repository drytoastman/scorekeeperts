<template>
    <div class='outer'>
    <v-expansion-panels multiple focusable hover accordion tile v-model='panelstate'>
        <v-expansion-panel v-for="event in orderedEvents" :key="event.eventid">
            <v-expansion-panel-header class='elevation-4' xcolor='primary lighten-1 white--text'>
                <v-container class="pa-0">
                    <v-row no-gutters align=center class='eventrow'>
                        <v-col class='datecol'>
                            <span class='eventdate'>{{event.date | dmdy}}</span>
                        </v-col>
                        <v-col class='namecol'>
                            <svg height="14" width="14">
                                <circle cx=7 cy=7 r="6" :fill="opencolor(event)" />
                            </svg>
                            <span class='eventname'>{{event.name}}</span>
                        </v-col>
                    </v-row>
                </v-container>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
                <RegisterEventDisplay :event="event" @regrequest="regrequest(event)" @payrequest="payrequest(event)"></RegisterEventDisplay>
            </v-expansion-panel-content>
        </v-expansion-panel>
    </v-expansion-panels>
    <ClassRegDialog   v-model=classDialogOpen   :event=dialogEvent></ClassRegDialog>
    <SessionRegDialog v-model=sessionDialogOpen :event=dialogEvent></SessionRegDialog>
    <EventCartAddDialog v-model=paymentOpen     :event=dialogEvent></EventCartAddDialog>
    </div>
</template>

<script>
import orderBy from 'lodash/orderBy'
import filter from 'lodash/filter'
import { mapState } from 'vuex'
import { isOpen, hasClosed } from '@/common/event'
import ClassRegDialog from '../components/ClassRegDialog.vue'
import SessionRegDialog from '../components/SessionRegDialog.vue'
import EventCartAddDialog from '../components/cart/EventCartAddDialog.vue'
import RegisterEventDisplay from '../components/RegisterEventDisplay.vue'

export default {
    components: {
        RegisterEventDisplay,
        ClassRegDialog,
        EventCartAddDialog,
        SessionRegDialog
    },
    data: () => ({
        classDialogOpen: false,
        sessionDialogOpen: false,
        paymentOpen: false,
        dialogEvent: null
    }),
    computed: {
        ...mapState(['events', 'counts', 'registered', 'panelstate']),
        // events by date, filtering out events that already occured as of today midnight, will still show up day of
        orderedEvents() { return filter(orderBy(this.events, ['date']), e => (new Date(e.date) - new Date()) > -86400) },
        panelstate: {
            get: function() { return this.$store.state.panelstate },
            set: function(v) { this.$store.state.panelstate = v }
        }
    },
    methods: {
        regrequest: function(event) {
            this.dialogEvent = event
            if (event.regtype > 0) {
                this.sessionDialogOpen = true
            } else {
                this.classDialogOpen = true
            }
        },
        payrequest: function(event) {
            this.dialogEvent = event
            this.paymentOpen = true
        },
        opencolor: function(event) {
            if (isOpen(event)) return '#4C4'
            if (hasClosed(event)) return '#C44'
            return '#BBB'
        }
    }
}
</script>

<style scoped>
    .outer {
        padding: 1rem;
    }
    .eventdate, .eventname {
        font-size: 1.2rem;
        white-space: nowrap;
        color: var(--v-primary-base);
    }
    .datecol {
        text-align: right;
        flex-grow: 0;
        flex-basis: 10rem;
    }
    .namecol svg {
        margin-left: 1rem;
        margin-right: 1rem;
    }

    @media (max-width: 700px) {
        .outer {
            padding-left: 0;
            padding-right: 0;
        }
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

    /*
    .v-expansion-panel-header--active {
        background: var(--v-secondary-base);
        color: white;
    }

    .v-expansion-panel-header:hover {
        background:#3f51b5;
        color: white;
    } */
</style>
