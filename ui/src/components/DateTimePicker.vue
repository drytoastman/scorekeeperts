<template>
  <v-dialog v-model="display" :width="dialogWidth">
    <template v-slot:activator="{ on }">
      <v-text-field :disabled="disabled" :label="label" :value="displayedDateTime" :style="fieldstyle" v-on="on" readonly></v-text-field>
    </template>

    <v-card>
      <v-card-text class="px-0 py-0">
        <v-tabs fixed-tabs v-model="activeTab" v-if="!dateOnly" >
          <v-tab key="calendar">
              Date
          </v-tab>
          <v-tab key="timer" :disabled="dateNotSelected">
              Time
          </v-tab>
          <v-tab-item key="calendar">
            <v-date-picker v-model="date" @input="showTimePicker" full-width></v-date-picker>
          </v-tab-item>
          <v-tab-item key="timer">
            <v-time-picker ref="timer" v-model="time" full-width></v-time-picker>
          </v-tab-item>
        </v-tabs>
        <div v-else>
            <v-date-picker v-model="date" @input="showTimePicker" full-width></v-date-picker>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <slot name="actions" :parent="this">
          <v-btn class='cancel' text @click.native="clearHandler">Cancel</v-btn>
          <v-btn class='ok' text @click="okHandler">Ok</v-btn>
        </slot>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { format, parse } from 'date-fns'

const VDATE = 'yyyy-MM-dd'
const VTIME = 'HH:mm'

export default {
    name: 'v-datetime-picker',
    model: {
        prop: 'datetimestr',
        event: 'input'
    },
    props: {
        datetimestr: {
            type: String,
            default: null
        },
        disabled: {
            type: Boolean
        },
        label: {
            type: String,
            default: ''
        },
        fieldstyle: {
            type: String,
            default: ''
        },
        dialogWidth: {
            type: Number,
            default: 340
        },
        dateOnly: {
            type: Boolean
        }
    },
    data() {
        return {
            display: false,
            activeTab: 0,
            date: '',
            time: ''
        }
    },
    mounted() {
        this.init()
    },
    computed: {
        displayedDateTime() {
            if (!this.date) { return '' }
            return format(this.combinedDate, this.dateOnly ? 'EEE MMM dd Y' : 'EEE MMM dd Y hh:mm a')
        },
        combinedDate() {
            const def = new Date()
            def.setTime(0)
            if (this.dateOnly) {
                return parse(this.date, VDATE, def)
            } else {
                return parse(this.date + ' ' + this.time, VDATE + ' ' + VTIME, def)
            }
        },
        dateNotSelected() {
            return !this.date
        }
    },
    methods: {
        init() {
            if (!this.datetimestr) { return }
            const d = new Date(this.datetimestr)
            this.date = format(d, VDATE)
            this.time = format(d, VTIME)
        },
        okHandler() {
            this.resetPicker()
            this.$emit('input', this.combinedDate.toISOString())
        },
        clearHandler() {
            this.resetPicker()
            this.init()
            this.$emit('input', this.datetimestr)
        },
        resetPicker() {
            this.display = false
            this.activeTab = 0
            if (this.$refs.timer) {
                this.$refs.timer.selectingHour = true
            }
        },
        showTimePicker() {
            if (!this.dateOnly) {
                this.activeTab = 1
            }
        }
    },
    watch: {
        datetimestr: function() {
            this.init()
        }
    }
}
</script>

<style scoped>
.cancel, .ok {
    color: var(--v-secondary-base);
}
</style>
