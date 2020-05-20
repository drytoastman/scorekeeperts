<template>
    <v-row justify="center">
        <v-dialog :value="value" @input="$emit('input')" persistent max-width="400px" >
            <v-card>
                <v-card-title>
                    <span class="headline">{{title}}</span>
                </v-card-title>
                <v-card-text :class='{disabledform: disableAll}'>
                    <v-container>
                        <v-form ref="form" lazy-validation>
                            <v-select v-model="carm.classcode" label="Class" :rules="classrules" :items="classlist" item-text='classcode'>
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
                                    <NumberPicker :classcode="carm.classcode" @selected="numselected"></NumberPicker>
                                </template>
                            </v-text-field>

                            <v-text-field v-model="carm.attr.year"  label="Year"   :rules="vrules.year"></v-text-field>
                            <v-text-field v-model="carm.attr.make"  label="Make"   :rules="vrules.make"></v-text-field>
                            <v-text-field v-model="carm.attr.model" label="Model"  :rules="vrules.model"></v-text-field>
                            <v-text-field v-model="carm.attr.color" label="Color"  :rules="vrules.color"></v-text-field>
                        </v-form>
                    </v-container>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="blue darken-1" text @click="$emit('input')">Cancel</v-btn>
                  <v-btn color="blue darken-1" text @click="save()">{{actionName}}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-row>
</template>

<script>
import { mapState } from 'vuex'
import { CarValidator } from '@common/lib'
import NumberPicker from '../components/NumberPicker'

export default {
    components: {
        NumberPicker
    },
    props: {
        value: {
            type: Boolean,
            default: () => false
        },
        title: String,
        car: Object,
        apiType: String
    },
    data() {
        return {
            vrules: CarValidator,
            classrules: [v => { return this.classlist.map(c => c.classcode).includes(v) || 'Need to select a valid class' }],
            indexrules: [v => { return !this.needindex || this.indexlist.map(i => i.indexcode).includes(v) || 'Need to select a valid index' }],
            numberrules: [...CarValidator.number, v => !this.usednumbers.includes(parseInt(v)) || 'Number taken'],
            carm: { attr: {} } // we get a copy when the dialog arg changes, data initializer won't catch that
        }
    },
    computed: {
        ...mapState(['classes', 'indexes', 'usednumbers']),
        actionName() {
            switch (this.apiType) {
                case 'insert': return 'Create'
                case 'update': return 'Update'
                case 'delete': return 'Delete'
                default: return '???'
            }
        },
        classlist: function() {
            return Object.values(this.classes).filter(c => c.classcode !== 'HOLD')
        },
        indexlist: function() {
            const restrict = (this.carm.classcode in this.classes) ? this.classes[this.carm.classcode].restrictedIndexes : []
            return Object.values(this.indexes).filter(i => restrict.includes(i.indexcode) && i.indexcode !== '')
        },
        needindex: function() { return this.indexlist.length > 0 },
        disableAll: function() { return this.actionName === 'Delete' }
    },
    methods: {
        numselected(num) {
            this.carm.number = num
        },
        save() {
            if (this.$refs.form.validate()) {
                if (!this.carm.carid) {
                    this.carm.carid = 'placeholder'
                }
                if (!this.needindex) {
                    this.carm.indexcode = ''
                }

                this.$store.dispatch('setdata', {
                    type: this.apiType,
                    cars: [this.carm],
                    busy: { key: 'busyCars', id: this.carm.carid }
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
.disabledform {
   background: #c8c8c8;
   pointer-events: none;
   opacity: 0.5;
}
.v-expansion-panel-header {
  font-size: 90%;
  padding: 3px !important;
  min-height: 0px;
}
.v-expansion-panel-content {
  font-family: Arial, Helvetica, sans-serif;
}
.v-expansion-panels {
  margin-top: 0rem;
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
