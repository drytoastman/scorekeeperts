<template>
    <v-row justify="center">
        <v-dialog :value="value" @input="$emit('input')" persistent max-width="450px">
            <v-container>
                <v-btn class='close' icon @click="$emit('input')"><v-icon>{{close}}</v-icon></v-btn>

                <v-card v-for="acct in paymentaccounts" :key="acct.accountid">
                    <v-card-title>{{acct.name}}</v-card-title>
                    <v-card-text v-for="e in accountEvents(acct.accountid)" :key="e.eventid" class='eventwrap'>
                        <h3>{{e.name}}</h3>
                        <div v-for="r in registered[e.eventid]" :key="r.eventid+r.carid" class='eventgrid'>
                            <CarLabel :car=cars[r.carid] fontsize="110%"></CarLabel>
                            <div v-if="hasPayments(r.eventid, r.carid)">
                                <span class='paidsum'>{{ paymentSum(r.eventid, r.carid)|dollars }}</span>
                            </div>
                            <v-select v-else :items="payitems(acct.accountid)" item-value="itemid" return-object hide-details solo dense
                                @input="newpurchase(acct.accountid, r.eventid, r.carid, $event)"
                            >
                                <template v-slot:selection="d">
                                    <span class='name'>{{ d.item.name }}</span> <span class='price'>{{ d.item.price|dollars }}</span>
                                </template>
                                <template v-slot:item="d">
                                    <span class='name'>{{ d.item.name }}</span> <span class='price'>{{ d.item.price|dollars }}</span>
                                </template>
                            </v-select>
                        </div>
                    </v-card-text>

                    <v-card-actions class='eventgrid'>
                        <div></div>
                        <v-btn color=secondary :disabled="!(total[acct.accountid]>0)">{{acct.type}} Payment {{total[acct.accountid]|dollars}}</v-btn>
                    </v-card-actions>
                </v-card>

            </v-container>
        </v-dialog>
    </v-row>
</template>

<script>
import Vue from 'vue'
import _ from 'lodash'
import { mapState } from 'vuex'
import CarLabel from '../../components/CarLabel'
import { EventWrap } from '@common/lib'
import { mdiCloseBox } from '@mdi/js'


export default {
    components: {
        CarLabel
    },
    props: {
        value: Boolean
    },
    filters: {
        dollars: function(v) {
            if (typeof v !== 'number') return ''
            return `$${(v / 100).toFixed(2)}`
        }
    },
    data() {
        return {
            close: mdiCloseBox,
            purchase: {},
            total: {}
        }
    },
    computed: {
        ...mapState(['events', 'registered', 'cars', 'payments', 'paymentitems', 'paymentaccounts']),
        orderedOpenEvents() { return _.orderBy(this.events, ['date']).filter(e => new EventWrap(e).isOpen()) }
    },
    methods: {
        payitems(accountid) {
            return [{ itemid: null, name: '' }, ...this.paymentitems.filter(i => i.accountid === accountid)]
        },
        accountEvents(accountid) {
            return this.orderedOpenEvents.filter(e => e.accountid === accountid)
        },
        hasPayments(eventid, carid) {
            return eventid in this.payments ? this.payments[eventid][carid] : false
        },
        paymentSum(eventid, carid) {
            return _.sumBy(this.payments[eventid][carid], 'amount')
        },
        newpurchase(accountid, eventid, carid, value) {
            if (!(accountid in this.purchase)) {
                this.purchase[accountid] = {}
            }
            this.purchase[accountid][eventid + carid] = value
            Vue.set(this.total, accountid, _(this.purchase[accountid]).values().sumBy('price'))
        }
    },
    watch: {
        value: function(newv) {
            if (newv) {
                // on open
            }
        }
    }
}
</script>

<style scoped>
.eventgrid {
    display: grid;
    align-items: center;
    grid-template-columns: 3fr 4fr;
    grid-template-rows: 50px;
}
.paidsum {
    font-style: italic;
    color: gray;
}

h3 {
    margin-top: 0.5rem;
    border-bottom: 1px solid #CCC;
}
.v-card__text {
    margin-bottom: 1rem;
}

.container {
    background: #DDD;
    padding: 1px 10px;
}
.close {
    display: block;
    margin-left: auto;
}
.v-card {
    margin-bottom: 1rem;
}
</style>
