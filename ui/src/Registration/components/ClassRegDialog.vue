<template>
    <v-row justify="center">
        <v-dialog :value="value" @input="$emit('input')" persistent max-width="400px">
            <v-card>
                <v-card-title>
                    <span class="primary--text headline">Register</span>
                </v-card-title>
                <v-card-text>
                    <LinkHoverToState :to="{name:'cars'}" variable="flashCars" class='carslink'>Create, Edit and Delete Cars Via the Cars Menu</LinkHoverToState>
                    <v-container>
                        <div class='nocars' v-if="nocars">
                            You haven't created any cars for this series.  You can do so via the above link.
                        </div>
                        <v-form ref="form" lazy-validation>
                            <div class='cargrid'>
                                <template v-for="car in cars">
                                    <v-btn x-large outlined
                                            :key="car.carid+'2'"
                                            :disabled="!checks[car.carid] && limitReached"
                                            :class="checks[car.carid] ? 'selected' : 'unselected'"
                                            @click="clickCar(car.carid)"
                                    >
                                        <v-checkbox hide-details :value="checks[car.carid]"></v-checkbox>
                                        <CarLabel :car="car"></CarLabel>
                                    </v-btn>
                                </template>
                            </div>
                            <div class='errortext'>
                                {{limitTypeReached}}
                            </div>
                        </v-form>
                    </v-container>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" text @click="$emit('input')">Cancel</v-btn>
                    <v-btn color="primary" text @click="update()" :disabled="nocars">Update</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-row>
</template>

<script>
import filter from 'lodash/filter'
import map from 'lodash/map'
import pickBy from 'lodash/pickBy'
import Vue from 'vue'
import { mapState } from 'vuex'
import CarLabel from '@/components/CarLabel'
import LinkHoverToState from './LinkHoverToState'

export default {
    components: {
        CarLabel,
        LinkHoverToState
    },
    props: {
        value: Boolean,
        event: Object
    },
    computed: {
        ...mapState(['cars', 'registered', 'counts']),
        nocars()       { return Object.values(this.cars).length <= 0 },
        ereg()         { return this.registered[this.event.eventid] || [] },
        ecounts()      { return this.counts[this.event.eventid] || {} },
        checkedCount() { return filter(Object.values(this.checks), v => v).length },
        limitReached() { return this.limitTypeReached !== null },
        limitTypeReached() {
            if (!this.event) { return null }
            if (this.checkedCount >= this.event.perlimit) {
                return `Personal limit of ${this.event.perlimit} met`
            } else if (this.event.totlimit) {
                if (this.ecounts.all - this.ereg.length + this.checkedCount >= this.event.totlimit) {
                    return `Event limit of ${this.event.totlimit} met`
                }
            }
            return null
        }
    },
    data() {
        return {
            checks: {}
        }
    },
    methods: {
        clickCar(carid) {
            if (carid in this.checks) {
                Vue.set(this.checks, carid, !this.checks[carid])
            } else {
                Vue.set(this.checks, carid, true)
            }
        },
        update() {
            // Create new reg objects and send request
            this.$store.dispatch('setdata', {
                type: 'eventupdate',
                eventid: this.event.eventid,
                items: {
                    registered: map(pickBy(this.checks), (v, k) => ({
                        carid: k,
                        eventid: this.event.eventid,
                        session: ''
                    }))
                },
                busy: { key: 'busyReg', id: this.event.eventid }
            })
            this.$emit('input')
        }
    },
    watch: {
        value: function(newv) {
            if (newv) {
                // dialog open
                this.checks = {}
                this.$nextTick(() => {
                    // wait for checkboxes to be created before setting data
                    this.ereg.forEach(v => {
                        Vue.set(this.checks, v.carid, true)
                    })
                    if ('form' in this.$refs) {
                        this.$refs.form.resetValidation()
                    }
                })
            }
        }
    }
}
</script>

<style scoped>
.cargrid {
    display: grid;
    align-items: center;
    row-gap: 10px;
}
.cargrid .v-btn {
    width: 100%;
    justify-content: left;
}
.cargrid .unselected {
    border: 1px solid rgb(200, 200, 200);
    background-color: rgb(250, 250, 250, 220) !important;
}
.cargrid .selected {
    border: 1px solid var(--v-primary-base);
    background-color: rgb(66,100,80,0.1) !important;
}
.cargrid .v-btn--disabled {
    opacity: 0.3;
    background-color: #FFF !important;
}
.v-input--selection-controls {
    margin-top: 0;
    padding-top: 0;
}
.errortext {
    margin-top: 10px;
    text-align: center;
    color: darkred;
}
</style>
