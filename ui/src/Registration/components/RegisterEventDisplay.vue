<template>
    <v-container class='outer'>
        <v-row v-if="!hasOpened">
            <v-col class='tlabel'>Opens:</v-col>
            <v-col class='tdata'>{{event.regopened | timedate}}</v-col>
        </v-row>
        <v-row>
            <v-col class='tlabel'>{{hasClosed ? 'Closed' : 'Closes'}}:</v-col>
            <v-col class='tdata' style='whitespace:nowrap'>{{event.regclosed | timedate }}</v-col>
        </v-row>
        <v-row v-if="event.location" >
            <v-col class='tlabel'>Location:</v-col>
            <v-col class='tdata'>{{event.location}}</v-col>
        </v-row>

        <!-- any attr items OTHER than notes and paymentreq -->
        <v-row v-for="key in Object.keys(event.attr).filter(k => !['notes','paymentreq'].includes(k))" :key="key">
            <v-col class='tlabel'>{{key | capitalize}}:</v-col>
            <v-col class='tdata'>{{event.attr[key]}}</v-col>
        </v-row>

        <v-row v-if="hasOpened && event.totlimit && event.sinlimit">
            <v-col class='tlabel'>Singles:</v-col>
            <v-col class='tdata'>{{ecounts.unique||0}}/{{event.sinlimit}}</v-col>

            <v-col class='tlabel'>Count:</v-col>
            <v-col class='tdata'>{{ecounts.all||0}}/{{event.totlimit}}</v-col>
        </v-row>

        <v-row no-gutters v-else-if="hasOpened">
            <v-col class='tlabel'>Count:</v-col>
            <v-col class='tdata'>{{ecounts.all||0}}{{event.totlimit && `/${event.totlimit}` || ''}}</v-col>
        </v-row>

        <v-row v-if="event.attr.notes && !hasClosed">
            <v-col class='tlabel'>Notes:</v-col>
            <v-col class='tdata' v-html=event.attr.notes></v-col>
        </v-row>

        <v-divider v-if="hasOpened"></v-divider>

        <v-row v-if="hasOpened">
            <div class='registrations'>
                <EventRegSelections :event=event class='selections'></EventRegSelections>
                <div v-if="isOpen" class='buttons'>
                    <v-btn color="secondary" @click="$emit('regrequest')" :loading="busyR" :disabled="busyP">Register</v-btn>
                    <v-btn v-if="showPayButton" color="secondary" @click="$emit('payrequest')" :loading="busyP" :disabled="busyR">Event Cart</v-btn>
                </div>
            </div>
        </v-row>
    </v-container>
</template>

<script>
import { mapState } from 'vuex'
import { isOpen, hasClosed, hasOpened } from '@/common/event'
import EventRegSelections from './EventRegSelections.vue'

export default {
    components: {
        EventRegSelections
    },
    filters: {
        timedate: function(v) {
            const d = new Date(v)
            return d.toDateString().slice(0, -4) + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' })
        }
    },
    props: {
        event: Object
    },
    computed: {
        ...mapState(['registered', 'paymentaccounts', 'paymentitems', 'payments', 'counts', 'busyReg', 'busyPay']),
        account() { return this.paymentaccounts[this.event.accountid] || null },
        ecounts() { return this.counts[this.event.eventid] || {} },
        ereg()    { return this.registered[this.event.eventid] || [] },
        epayments() { return (this.payments[this.event.eventid] || []).filter(p => !p.refunded) },
        isOpen()    { return isOpen(this.event) },
        hasOpened() { return hasOpened(this.event) },
        hasClosed() { return hasClosed(this.event) },
        busyR()   { return this.busyReg[this.event.eventid] === true },
        busyP()   { return this.busyPay[this.event.eventid] === true },
        showPayButton() {
            if (!this.event.accountid) return false

            // still non-car things to purchse
            for (const fee of this.$store.getters.eventotherfees(this.event.eventid)) {
                if (this.epayments.filter(p => p.itemname === fee.item.name).length < fee.map.maxcount) {
                    return true
                }
            }

            // registered car without payment
            for (const reg of this.ereg) {
                if (this.epayments.filter(p => p.carid === reg.carid).length === 0) {
                    return true
                }
            }

            return false
        }
    },
    watch: {
    }
}
</script>

<style scoped lang='scss'>
.v-divider {
    margin: 1rem;
}

.row {
    align-items: baseline;
    margin: 0;
    padding: 0;

    > .col {
        padding: 0;
        flex-grow:0;
        min-width: 5rem;
        + .col {
            flex-grow: 1;
        }
    }

    .tlabel {
        font-weight: bold;
        flex-grow: 0.15;
        text-align: right;
        margin-right: 1rem;
    }
    .tdata {
        font-size: 95%;
    }
}

.registrations {
    display: inline-grid;
    margin: 0 auto;
    @media (max-width: 600px) {
        width: 100%;
    }
    .buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        column-gap: 1rem;
        @media (min-width: 600px) {
            min-width: 25rem;
        }
    }
}
</style>
