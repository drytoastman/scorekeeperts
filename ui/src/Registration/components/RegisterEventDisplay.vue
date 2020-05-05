<template>
    <v-container>
        <v-row v-if="!wrap.hasOpened()" align=center no-gutters>
            <v-col class='title'>Opens:</v-col>
            <v-col>{{event.regopened | timedate}}</v-col>
        </v-row>
        <v-row align=center no-gutters>
            <v-col class='title'>{{wrap.hasClosed() ? 'Closed' : 'Closes'}}:</v-col>
            <v-col style='whitespace:nowrap'>{{event.regclosed | timedate }}</v-col>
        </v-row>
        <v-row align=center no-gutters v-if="event.location" >
            <v-col class='title'>Location:</v-col>
            <v-col>{{event.location}}</v-col>
        </v-row>

        <v-row align=center no-gutters v-for="key in Object.keys(event.attr).filter(k => !['notes','paymentreq'].includes(k))" :key="key">
            <v-col class='title'>{{key | capitalize}}:</v-col>
            <v-col>{{event.attr[key]}}</v-col>
        </v-row>

        <v-row align=center no-gutters v-if="wrap.hasOpened() && event.totlimit && event.sinlimit">
            <v-col class='title'>Singles:</v-col><v-col>{{counts.unique||0}}/{{event.sinlimit}}</v-col>
            <v-col class='title'>Count:</v-col>  <v-col>{{counts.all||0}}/{{event.totlimit}}</v-col>
        </v-row>

        <v-row align=center no-gutters v-else-if="wrap.hasOpened()">
            <v-col class='title'>Count:</v-col><v-col>{{counts.all||0}}{{event.totlimit && `/${event.totlimit}` || ''}}</v-col>
        </v-row>

        <v-row align=center no-gutters v-if="event.attr.notes && !wrap.hasClosed()">
            <v-col class='title'>Notes:</v-col>
            <v-col v-html=event.attr.notes></v-col>
        </v-row>

        <v-divider v-if="wrap.hasOpened()"></v-divider>

        <v-row align=center no-gutters v-if="wrap.hasOpened()">
            <v-col class='title'>My Count:</v-col><v-col>{{registration.length}}/{{event.perlimit}}</v-col>
        </v-row>

        <v-row align=center no-gutters v-if="wrap.hasOpened()">
            <v-col class='title'>Entries:</v-col>
            <v-col class='d-flex'>
                <RegCard v-for="reg in registration" :key="reg.carid" :car="cars[reg.carid]" :reg="reg" :payments="paymentsForReg(reg)">
                </RegCard>
                <v-btn dark fab color="secondary" class='align-self-center'>Add</v-btn>
            </v-col>
        </v-row>

    </v-container>
</template>

<script>
import { mapState } from 'vuex'
import { EventWrap } from '@common/lib'
import RegCard from './RegCard'

export default {
    components: {
        RegCard
    },
    filters: {
        timedate: function(v) {
            const d = new Date(v)
            return d.toDateString() + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', timeZoneName: 'short' })
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
            try { return this.payments[reg.eventid][reg.carid] } catch {}
        }
    }
}
</script>

<style scoped>
    .v-divider {
        margin: 1rem;
    }
    .regcard {
        margin-right: 1rem;
    }
    .title {
        font-weight: bold;
        flex-grow: 0.15;
        text-align: right;
        margin-right: 0.5rem;
    }
</style>
