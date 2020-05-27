<template>
    <v-dialog :value="value" @input="$emit('input')" persistent max-width="400px">
        <v-card>
            <v-card-title>
                <span class="headline">Register for Session</span>
            </v-card-title>
            <v-card-text>
                <div class='carslink'>
                    <router-link :to="{name:'cars'}">Create, Edit and Delete Cars Here</router-link>
                </div>
                <v-form ref="form" lazy-validation>
                    <v-container class='nocars' v-if="nocars">
                        You haven't created any cars for this series.  You can do so via the above link.
                    </v-container>
                    <v-container v-else class='formgrid'>
                        <template v-for="session in sessions">
                            <span class='sessionlabel' :key="session+'y'">{{session}}</span>
                            <v-select :key="session+'z'" :items="carlist" item-value="carid" v-model="sessionselect[session]">
                                <template v-slot:item="d"><SessionCarLabel :car=d.item></SessionCarLabel></template>
                                <template v-slot:selection="d"><SessionCarLabel :car=d.item></SessionCarLabel></template>
                            </v-select>
                        </template>

                    </v-container>
                    <div class='errortext'>
                    </div>
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="$emit('input')">Cancel</v-btn>
                <v-btn color="blue darken-1" text @click="update()" :disabled="nocars">Update</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import Vue from 'vue'
import { mapState } from 'vuex'
import _ from 'lodash'
import { getSessions } from '@common/lib/event'
import SessionCarLabel from '../../components/SessionCarLabel'

export default {
    components: {
        SessionCarLabel
    },
    props: {
        value: Boolean,
        event: Object
    },
    data() {
        return {
            sessionselect: {}
        }
    },
    computed: {
        ...mapState(['cars', 'registered']),
        nocars()   { return Object.values(this.cars).length <= 0 },
        ereg()     { return this.registered[this.event.eventid] || [] },
        sessions() { return this.event ? getSessions(this.event) : [] },
        carlist()  { return [{ carid: '' }, ...Object.values(this.cars)] }
    },
    methods: {
        update() {
            // Create new reg objects and send request
            this.$store.dispatch('setdata', {
                type: 'eventupdate',
                eventid: this.event.eventid,
                registered: _(this.sessionselect).map((v, k) => ({
                    session: k,
                    carid: v,
                    eventid: this.event.eventid
                })).filter('carid'),
                busy: { key: 'busyReg', id: this.event.eventid }
            })
            this.$emit('input')
        }
    },
    watch: {
        value: function(newv) {
            if (newv) {
                this.sessionselect = {}
                this.ereg.forEach(v => {
                    Vue.set(this.sessionselect, v.session, v.carid)
                })
            }
        }
    }
}
</script>

<style scoped>
.formgrid {
    display: grid;
    grid-template-columns: 1fr 7fr;
    column-gap: 0.3rem;
    align-items: center;
}
.sessionlabel {
    font-weight: bold;
    font-size: 120%;
}
.errortext {
    text-align: center;
    color: red;
}
</style>
