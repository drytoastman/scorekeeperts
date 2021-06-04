<template>
    <div>
        <div class='requests inset'>
            <div v-if="settings.requestbarcodes && !driver.barcode" class='barcoderequest'>
                {{currentSeries}} requests that you set the barcode value in your <router-link :to="{name: 'profile', params: {}}">profile</router-link> if you have one
            </div>

            <div v-if="settings.requestrulesack && (!driversattr.rulesack)" class='rulesrequest'>
                {{currentSeries}} requires that the <a @click="rulesDialog=true">series rules be acknowledged</a>
                <RulesAcknowledegment v-model="rulesDialog" @ok="addRulesAck"></RulesAcknowledegment>
            </div>

            <div v-if="requestMembership" class='memberrequest'>
                <MemberPayment class='memberselect'></MemberPayment>
            </div>
            <div v-else-if="driverMembership.length" class='memberrequest'>
                Membership Paid
            </div>
        </div>

        <v-expansion-panels multiple focusable hover accordion tile v-model='panelstate' v-if='!(settings.requestrulesack && !driversattr.rulesack && settings.rulesackbeforereg)'>
            <v-expansion-panel v-for="event in events" :key="event.eventid">
                <v-expansion-panel-header class='elevation-4' xcolor='primary lighten-1 white--text' :disabled="event.isexternal">
                    <template v-slot:actions>
                        <v-icon color="primary" v-if="!event.isexternal">$expand</v-icon>
                        <v-icon v-else></v-icon>
                    </template>
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
                                <span class='external' v-if='event.isexternal'>External</span>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-expansion-panel-header>
                <v-expansion-panel-content v-if="!event.isexternal">
                    <RegisterEventDisplay :event="event" @regrequest="regrequest(event)" @payrequest="payrequest(event)"></RegisterEventDisplay>
                </v-expansion-panel-content>
            </v-expansion-panel>
        </v-expansion-panels>
    </div>
</template>

<script>
import filter from 'lodash/filter'
import { isFuture, add } from 'date-fns'
import { mapState, mapGetters } from 'vuex'

import { parseDate } from 'sctypes/util'
import { isOpen, hasClosed } from 'sctypes/event'
import RegisterEventDisplay from '../components/RegisterEventDisplay.vue'
import RulesAcknowledegment from '../components/RulesAcknowledgement.vue'
import MemberPayment from '../components/cart/MemberPayment.vue'

export default {
    components: {
        RegisterEventDisplay,
        RulesAcknowledegment,
        MemberPayment
    },
    data: () => ({
        classDialogOpen: false,
        sessionDialogOpen: false,
        paymentOpen: false,
        cartOpen: false,
        dialogEvent: null,
        rulesDialog: false
    }),
    computed: {
        ...mapState(['currentSeries', 'driversattr', 'settings', 'events', 'counts', 'registered', 'paymentitems', 'panelstate']),
        ...mapGetters(['driver', 'membershipfees', 'driverMembership', 'orderedEvents']),
        // events by date, filtering out events that already occured as of 2 days forward at midnight, will still show up day of and next
        events() { return filter(this.orderedEvents, e => isFuture(add(parseDate(e.date), { days: 2 }))) },

        panelstate: {
            get: function() { return this.$store.state.panelstate },
            set: function(v) { this.$store.state.panelstate = v }
        },
        requestMembership() {
            return this.settings.membershipaccount && this.membershipfees.length > 0 && !this.driverMembership.length
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
            if (event.isexternal) return '#FFF'
            if (isOpen(event)) return '#4C4'
            if (hasClosed(event)) return '#C44'
            return '#BBB'
        },
        addRulesAck() {
            this.$store.dispatch('setdata', {
                items: {
                    driversattr: Object.assign({}, this.driversattr, { rulesack: true })
                }
            })
        }
    }
}
</script>

<style scoped lang="scss">
    .requests {
        margin-bottom: 1rem;
        a {
            text-decoration: underline;
        }
        .barcoderequest, .memberrequest, .rulesrequest {
            text-align: center;
        }
        .barcoderequest, .memberrequest {
            color: grey;
        }
        .memberrequest {
            display: flex;
            flex-direction: row-reverse;
        }
        .memberselect {
            max-width: 20rem;
        }
        .rulesrequest {
            color: rgba(200, 0, 0, 0.7);
            a {
                color: rgba(200, 0, 0, 0.7);
            }
            margin-bottom: 0.5rem;
        }
    }

    .eventdate, .eventname {
        font-size: 1.2rem;
        white-space: nowrap;
        color: var(--v-primary-base);
    }
    .external {
        margin-left: 1rem;
        font-size: 1.2rem;
        color: var(--v-secondary-base);
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
</style>
