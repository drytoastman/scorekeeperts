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
                            <div v-for="car in cars" :key="car.carid" class='regline d-flex'>
                                <v-checkbox v-model="checks[car.carid]"
                                            :disabled="!checks[car.carid] && limitReached"
                                ></v-checkbox>
                                <v-btn elevation=1 x-large
                                        @click="clickCar(car.carid)"
                                        :disabled="!checks[car.carid] && limitReached"
                                        :class="checks[car.carid] ? 'selected' : 'unselected'"
                                ><CarLabel :car="car"></CarLabel></v-btn>
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
        ...mapState(['series', 'cars', 'registered', 'counts']),
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
                series: this.series,
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
.regline .v-btn {
    flex-grow: 1;
    justify-content: left;
    border: 1px solid #AAA;
}
.regline .unselected {
    background-color: #FFF !important;
}
.regline .selected {
    background-color: #CCDA !important;
}
.errortext {
    text-align: center;
    color: red;
}
</style>
