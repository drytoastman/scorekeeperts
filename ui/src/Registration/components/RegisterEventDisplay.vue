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
            <v-col class='tlabel'>Singles:</v-col><v-col>{{ecounts.unique||0}}/{{event.sinlimit}}</v-col>
            <v-col class='tlabel'>Count:</v-col>  <v-col>{{ecounts.all||0}}/{{event.totlimit}}</v-col>
        </v-row>

        <v-row no-gutters v-else-if="wrap.hasOpened()">
            <v-col class='tlabel'>Count:</v-col><v-col>{{ecounts.all||0}}{{event.totlimit && `/${event.totlimit}` || ''}}</v-col>
        </v-row>

        <v-row v-if="event.attr.notes && !wrap.hasClosed()">
            <v-col class='tlabel'>Notes:</v-col>
            <v-col v-html=event.attr.notes></v-col>
        </v-row>

        <v-divider v-if="wrap.hasOpened()"></v-divider>

        <v-row :class="ereg.length==0 ? 'centerrow' : ''" v-if="wrap.hasOpened()">
            <v-col class='tlabel'>
                Entries:
                <span class='plain'>{{ereg.length}}/{{event.perlimit}}</span>
            </v-col>
            <v-col>
                <v-container class='inner'>
                    <v-row dense v-if="ereg.length > 0">
                        <v-col v-for="reg in ereg" :key="reg.carid">
                            <RegCard :reg="reg"></RegCard>
                        </v-col>
                    </v-row>
                    <v-row dense>
                        <v-col>
                            <v-btn dark color="secondary" @click="$emit('regrequest')" :loading="busy">Register</v-btn>
                        </v-col>
                        <v-col v-if="ereg.length > 0 && event.accountid">
                            <v-btn dark color="secondary" @click.stop='' :loading="busy">Payments</v-btn>
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

export default {
    components: {
        RegCard
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
    props: {
        event: Object,
        busy: Boolean
    },
    computed: {
        ...mapState(['registered', 'counts']),
        ecounts() { return this.counts[this.event.eventid] },
        ereg()    { return this.registered[this.event.eventid] },
        wrap()    { return new EventWrap(this.event) }
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
    .row.centerrow {
        align-items: center;
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
