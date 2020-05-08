<template>
  <v-row justify="center">
    <v-dialog :value="value" @input="$emit('input')" persistent max-width="400px" >
      <v-card>
        <v-card-title>
          <span class="headline">{{title}}</span>
        </v-card-title>
        <v-card-text :class='{disabledform: disableAll}'>
          <v-container>

            <v-form ref="form" lazy-validation >
              <v-select v-model="carm.classcode" label="Class" :rules="classrules" :items="classlist" item-text='classcode' @change='classcodechange'>
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

              <v-text-field v-model="carm.number"     label="Number" :rules="numberrules"></v-text-field>

              <v-expansion-panels v-show="!disableAll">
                <v-expansion-panel>
                  <v-expansion-panel-header><span class='text-center'>Numbers Already Taken In {{classcode}}</span></v-expansion-panel-header>
                  <v-expansion-panel-content><span>{{usedNumbersProxy.join(', ')}}</span></v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>

              <!-- v-divider class='spacer'></v-divider -->
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

export default {
    props: {
        value: {
            type: Boolean,
            default: () => false
        },
        title: String,
        car: Object,
        actionName: String
    },
    data() {
        return {
            vrules: CarValidator,
            classcode: '',
            usedNumbersProxy: [],
            classrules: [v => { return this.classlist.map(c => c.classcode).includes(v) || 'Need to select a valid class' }],
            indexrules: [v => { return !this.needindex || this.indexlist.map(i => i.indexcode).includes(v) || 'Need to select a valid index' }],
            numberrules: [...CarValidator.number, v => !this.usednumbers.includes(parseInt(v)) || 'Number taken']
        }
    },
    computed: {
        ...mapState(['series', 'classes', 'indexes', 'usednumbers']),
        carm: function() {
            return JSON.parse(JSON.stringify(this.car || { attr: {} })) // get a copy so we don't mutate orig
        },
        classlist: function() {
            return Object.values(this.classes).filter(c => c.classcode !== 'HOLD')
        },
        indexlist: function() {
            const restrict = (this.classcode in this.classes) ? this.classes[this.classcode].restrictedIndexes : []
            return Object.values(this.indexes).filter(i => restrict.includes(i.indexcode) && i.indexcode !== '')
        },
        needindex: function() { return this.indexlist.length > 0 },
        disableAll: function() { return this.actionName === 'Delete' }
    },
    methods: {
        save() {
            if (this.$refs.form.validate()) {
                if (!this.needindex) {
                    this.carm.indexcode = ''
                }
                this.$emit('save', this.carm)
                this.$emit('input')
            }
        },
        classcodechange() {
            this.classcode = this.carm.classcode // tickle reactivity when v-select changes
        }
    },
    watch: {
        value: function(newv) {
            if (newv) { // dialog open
                if ('form' in this.$refs) { this.$refs.form.resetValidation() } // reset validations if present
                this.classcode = this.carm.classcode // tickle reactivity
            }
        },
        classcode: function() {
            this.usedNumbersProxy = ['loading ...']
            this.$store.dispatch('getUsedNumbers', { series: this.series, classcode: this.classcode })
        },
        usednumbers: function() {
            this.usedNumbersProxy = this.usednumbers
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
</style>
