<template>
    <v-row justify="center">
        <v-dialog :value="value" @input="$emit('input')" persistent max-width="400px">
            <v-card>
                <v-card-title>
                    <span class="headline">Register</span>
                </v-card-title>
                <v-card-text>
                    <v-container>
                        <v-form ref="form" lazy-validation>
                            <div class='cargrid'>
                                <template v-for="car in cars">
                                    <v-checkbox hide-details
                                                v-model="checks[car.carid]"
                                                :key="car.carid+'1'"
                                                :disabled="!checks[car.carid] && limitReached"
                                    ></v-checkbox>
                                    <v-btn elevation=2 x-large
                                            :key="car.carid+'2'"
                                            @click="clickCar(car.carid)"
                                            :disabled="!checks[car.carid] && limitReached"
                                            :class="checks[car.carid] ? 'selected' : 'unselected'"
                                    ><CarLabel :car="car"></CarLabel></v-btn>
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
                    <v-btn color="blue darken-1" text @click="$emit('input')">Cancel</v-btn>
                    <v-btn color="blue darken-1" text @click="update()">Update</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-row>
</template>

<script>
import Vue from 'vue'
import _ from 'lodash'
import { mapState } from 'vuex'
import CarLabel from '../../components/CarLabel'

export default {
    components: {
        CarLabel
    },
    props: {
        value: Boolean,
        event: Object
    },
    computed: {
        ...mapState(['cars', 'registered', 'counts']),
        ereg()         { return this.registered[this.event.eventid] || [] },
        ecounts()      { return this.counts[this.event.eventid] || {} },
        checkedCount() { return _.filter(Object.values(this.checks), v => v).length },
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
                registered: _.map(_.pickBy(this.checks), (v, k) => ({
                    carid: k,
                    eventid: this.event.eventid,
                    session: ''
                })),
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
                this.ereg.forEach(v => {
                    Vue.set(this.checks, v.carid, true)
                })
                if ('form' in this.$refs) {
                    this.$refs.form.resetValidation()
                }
            }
        }
    }
}
</script>

<style scoped>
.cargrid {
    display: grid;
    grid-template-columns: 30px 1fr;
    align-items: center;
    row-gap: 10px;
}
.cargrid .v-btn {
    width: 100%;
    justify-content: left;
}
.cargrid .unselected {
    background-color: #FFF !important;
}
.cargrid .selected {
    background-color: #5B6A8E26 !important;
}
.cargrid .v-btn--disabled {
    opacity: 0.3;
}
.v-input--selection-controls {
    margin-top: 0;
    padding-top: 0;
}
.errortext {
    margin-top: 10px;
    text-align: center;
    color: red;
}
</style>
