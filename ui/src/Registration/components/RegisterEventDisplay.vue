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
            <EventRegSelections :event=event></EventRegSelections>
        </v-row>
    </v-container>
</template>

<script>
import { format } from 'date-fns'
import { mapState } from 'vuex'
import { isOpen, hasClosed, hasOpened } from '@/common/event'
import EventRegSelections from './EventRegSelections.vue'
import { parseTimestamp } from '@/common/util'

export default {
    components: {
        EventRegSelections
    },
    filters: {
        timedate: function(v) {
            return format(parseTimestamp(v), 'ccc MMM dd hh:mm a')
        }
    },
    props: {
        event: Object
    },
    computed: {
        ...mapState(['cars', 'counts']),
        ecounts() { return this.counts[this.event.eventid] || {} },
        isOpen()    { return isOpen(this.event) },
        hasOpened() { return hasOpened(this.event) },
        hasClosed() { return hasClosed(this.event) }
    }
}
</script>

<style scoped lang='scss'>
.v-divider {
    margin: 1rem;
}

.carslink {
    width: 100%;
    text-align: center;
    margin-bottom: 5px;
    font-style: italic;
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
</style>
