<template>
    <BaseDialog :value="value" :apiType="apiType" dataType="Car" width="400px" @input="$emit('input')" @update="update">
        <v-container>
            <v-form ref="form" lazy-validation>
                <v-select v-model="carm.classcode" label="Class" :rules="classrules" :items="classlist" @change="loadNumbers" item-text='classcode'>
                    <template v-slot:item="d">
                        <span class='classcode'>{{ d.item.classcode }}</span><span class='descrip'>{{ d.item.descrip }}</span>
                    </template>
                </v-select>

                <v-select v-model="carm.indexcode" :rules="indexrules" :items="indexlist" item-value='indexcode' item-text='indexcode'
                            :label='needindex?"Index":"No index required"' :disabled="!needindex">
                    <template v-slot:item="d">
                        <span class='indexcode'>{{ d.item.indexcode }}</span><span class='descrip'>{{ d.item.descrip }}</span>
                    </template>
                </v-select>

                <v-text-field v-model="carm.number"     label="Number" :rules="numberrules" :disabled="!carm.classcode">
                    <template v-slot:append-outer>
                        <NumberPicker :classcode="carm.classcode" :usednumbers="usednumbers" @selected="numselected"></NumberPicker>
                    </template>
                </v-text-field>

                <v-text-field v-model="carm.attr.year"  label="Year"   :rules="vrules.year"></v-text-field>
                <v-text-field v-model="carm.attr.make"  label="Make"   :rules="vrules.make"></v-text-field>
                <v-text-field v-model="carm.attr.model" label="Model"  :rules="vrules.model"></v-text-field>
                <v-text-field v-model="carm.attr.color" label="Color"  :rules="vrules.color"></v-text-field>
            </v-form>
        </v-container>
    </BaseDialog>
</template>

<script>
import isEmpty from 'lodash/isEmpty'
import Vue from 'vue'
import { CarValidator } from '@/common/car'
import { restrictedRegistrationIndexes } from '@/common/classdata'
import NumberPicker from './NumberPicker'
import BaseDialog from './BaseDialog'

export default {
    components: {
        BaseDialog,
        NumberPicker
    },
    props: {
        value: Boolean,
        car: Object,
        apiType: String,
        eClasses: Object,
        eIndexes: Object,
        eSeries: String,
        eDriverId: String,
        anyNumber: Boolean
    },
    data() {
        return {
            vrules: CarValidator,
            classrules: [v => { return this.classlist.map(c => c.classcode).includes(v) || 'Need to select a valid class' }],
            indexrules: [v => { return !this.needindex || this.indexlist.map(i => i.indexcode).includes(v) || 'Need to select a valid index' }],
            numberrules: [...CarValidator.number, v => this.anyNumber || !(this.usednumbers && this.usednumbers.includes(parseInt(v))) || 'Number taken'],
            carm: { attr: {} }, // we get a copy when the dialog arg changes, data initializer won't catch that
            usednumbers: undefined // [1, 2, 3]
        }
    },
    computed: {
        classes() {
            return isEmpty(this.eClasses) ? this.$store.state.classes : this.eClasses
        },
        indexes() {
            return isEmpty(this.eIndexes) ? this.$store.state.indexes : this.eIndexes
        },
        classlist: function() {
            return Object.values(this.classes).filter(c => c.classcode !== 'HOLD')
        },
        indexlist: function() {
            let restrict = []
            if (this.carm.classcode in this.classes) {
                const cls = this.classes[this.carm.classcode]
                if (cls.carindexed) {
                    restrict = restrictedRegistrationIndexes(cls.caridxrestrict, Object.keys(this.indexes))
                }
            }
            return Object.values(this.indexes).filter(i => restrict.includes(i.indexcode) && i.indexcode !== '')
        },
        needindex: function() { return this.indexlist.length > 0 }
    },
    methods: {
        loadNumbers() {
            if (this.carm.classcode) {
                this.$store.dispatch('getdata', {
                    items: 'usednumbers',
                    series: this.eSeries,
                    driverid: this.eDriverId,
                    classcode: this.carm.classcode
                }).then(data => {
                    this.usednumbers = data.usednumbers
                })
            } else {
                this.usednumbers = undefined
            }
        },

        numselected(num) {
            Vue.set(this.carm, 'number', num) // use Vue.set to catch it even if we started blank
        },
        update() {
            if (this.apiType === 'delete' || this.$refs.form.validate()) {
                if (!this.carm.carid) {
                    this.carm.carid = 'placeholder'
                }
                if (!this.needindex) {
                    this.carm.indexcode = ''
                }

                this.$store.dispatch('setdata', {
                    type: this.apiType,
                    series: this.eSeries,
                    driverid: this.eDriverId,
                    items: { cars: [this.carm] },
                    busy: { key: 'busyCars', id: this.carm.carid }
                }).then(() => {
                    this.$emit('complete', this.apiType, this.carm)
                })

                this.$emit('save', this.carm)
                this.$emit('input')
            }
        }
    },
    watch: {
        value: function(newv) {
            if (newv) { // dialog open
                if ('form' in this.$refs) { this.$refs.form.resetValidation() } // reset validations if present
                this.carm = JSON.parse(JSON.stringify(this.car || { attr: {} }))
                this.loadNumbers()
            }
        }
    }
}
</script>

<style scoped>
.indexcode, .classcode {
  min-width: 3rem;
  text-align: right;
  margin-right: 10px;
}
.descrip {
  font-size: 0.9rem;
  color: grey;
}
.spacer {
  margin-top: 1rem;
  margin-bottom: 1rem;
}
.v-input__append-outer .row {
    margin-left: 0;
    margin-top: -10px;
}
.v-text-field {
    margin-top: 2px;
}
</style>
