<template>
    <v-container class='outer'>
        <v-row v-if="!wrap.hasOpened()">
            <v-col class='tlabel'>Opens:</v-col>
            <v-col>{{event.regopened | timedate}}</v-col>
        </v-row>
        <v-row>
            <v-col class='tlabel'>{{wrap.hasClosed() ? 'Closed' : 'Closes'}}:</v-col>
            <v-col style='whitespace:nowrap'>{{event.regclosed | timedate }}</v-col>
        </v-row>
        <v-row v-if="event.location" >
            <v-col class='tlabel'>Location:</v-col>
            <v-col>{{event.location}}</v-col>
        </v-row>

        <!-- any attr items OTHER than notes and paymentreq -->
        <v-row v-for="key in Object.keys(event.attr).filter(k => !['notes','paymentreq'].includes(k))" :key="key">
            <v-col class='tlabel'>{{key | capitalize}}:</v-col>
            <v-col>{{event.attr[key]}}</v-col>
        </v-row>

        <v-row v-if="wrap.hasOpened() && event.totlimit && event.sinlimit">
            <v-col class='tlabel'>Singles:</v-col><v-col>{{counts.unique||0}}/{{event.sinlimit}}</v-col>
            <v-col class='tlabel'>Count:</v-col>  <v-col>{{counts.all||0}}/{{event.totlimit}}</v-col>
        </v-row>

        <v-row no-gutters v-else-if="wrap.hasOpened()">
            <v-col class='tlabel'>Count:</v-col><v-col>{{counts.all||0}}{{event.totlimit && `/${event.totlimit}` || ''}}</v-col>
        </v-row>

        <v-row v-if="event.attr.notes && !wrap.hasClosed()">
            <v-col class='tlabel'>Notes:</v-col>
            <v-col v-html=event.attr.notes></v-col>
        </v-row>

        <v-divider v-if="wrap.hasOpened()"></v-divider>

        <v-row v-if="wrap.hasOpened()">
            <v-col class='tlabel'>
                Entries:
                <span class='plain'>{{registration.length}}/{{event.perlimit}}</span>
            </v-col>
            <v-col>
                <v-container class='inner'>
                    <v-row dense>
                        <v-col v-for="reg in registration" :key="reg.carid">
                            <RegCard :car="cars[reg.carid]" :reg="reg" :payments="paymentsForReg(reg)" :wrap="wrap"></RegCard>
                        </v-col>
                        <v-col v-if="wrap.isOpen()" class='d-flex align-center'>
                            <CarPicker :event="event" :inuse="registration"></CarPicker>
                        </v-col>
                    </v-row>
                </v-container>
            </v-col>
        </v-row>

    </v-container>
</template>

<script>
import { mapState } from 'vuex'
import { EventWrap } from '@common/lib'
import RegCard from './RegCard'
import CarPicker from './CarPicker'

export default {
    components: {
        RegCard,
        CarPicker
    },
    filters: {
        timedate: function(v) {
            const d = new Date(v)
            return d.toDateString().slice(0, -4) + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' })
        },
        capitalize: function(v) {
            return v.charAt(0).toUpperCase() + v.slice(1)
        }
    },
    computed: {
        ...mapState(['cars', 'payments']),
        wrap: function() { return new EventWrap(this.event) }
    },
    props: {
        event: {
            type: Object, // SeriesEvent
            default: () => ({ attr: {} })
        },
        counts: {
            type: Object,
            default: () => ({})
        },
        registration: {
            type: Array,
            default: () => []
        }
    },
    methods: {
        paymentsForReg: function(reg) {
            try { return this.payments[reg.eventid][reg.carid] || [] } catch {}
            return []
        }
    }
}
</script>

<style scoped>
    .v-divider {
        margin: 1rem;
    }
    .row {
        align-items: baseline;
        margin: 0;
        padding: 0;
    }
    .outer > .row > .col {
        padding: 0;
        flex-grow:0;
        min-width: 5rem;
    }
    .outer > .row > .col + .col {
        flex-grow: 1;
    }
    .inner {
        padding: 0;
        margin-left: -5px;
    }
    .inner .row {
        align-items: stretch;
    }
    .inner .col {
        flex-grow: 0;
    }
    .regcard {
        width: 14rem;
    }
    .tlabel {
        font-weight: bold;
        flex-grow: 0.15;
        text-align: right;
        margin-right: 0.5rem;
    }
    .plain {
        font-weight: normal;
        color:gray;
    }
</style>
