<template>
  <v-dialog v-model="display" :width="dialogWidth">
    <template v-slot:activator="{ on }">
      <v-text-field :disabled="disabled" :label="label" :value="displayedDateTime" :style="fieldstyle" :class="fieldclass" :rules="rules" v-on="on" readonly></v-text-field>
    </template>

    <v-card>
      <v-card-text class="nosurround">
        <!-- Date and time -->
        <v-tabs fixed-tabs background-color="primary" dark v-model="activeTab" v-if="!dateOnly && !timeOnly" >
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

        <!-- just date -->
        <div v-else-if="dateOnly">
            <v-date-picker v-model="date" full-width></v-date-picker>
        </div>

        <!-- just time -->
        <div v-else-if="timeOnly">
            <v-time-picker ref="timer" v-model="time" full-width></v-time-picker>
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
        fieldclass: {
            type: String,
            default: ''
        },
        dialogWidth: {
            type: Number,
            default: 340
        },
        dateOnly: {
            type: Boolean
        },
        timeOnly: {
            type: Boolean
        },
        rules: {
            type: Array
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
            try {
                let fmt = 'EEE MMM dd Y hh:mm a z'
                if (this.dateOnly) fmt = 'EEE MMM dd Y'
                if (this.timeOnly) fmt = 'hh:mm a z'
                return format(this.combinedDate, fmt).replace(/GMT-8/, 'PST').replace(/GMT-7/, 'PDT')
            } catch (error) {
                return ''
            }
        },
        combinedDate() {
            const def = new Date()
            def.setTime(0)
            if (this.dateOnly && this.date)      return parse(this.date, VDATE, def)
            else if (this.timeOnly && this.time) return parse(this.time, VTIME, def)
            else if (this.date && this.time)     return parse(this.date + ' ' + this.time, VDATE + ' ' + VTIME, def)
            return null
        },
        dateNotSelected() {
            return !this.date
        }
    },
    methods: {
        init() {
            if (!this.datetimestr) { return }
            let full = this.datetimestr
            let d
            if (full.indexOf('T') < 0) {
                d = parse(full, 'yyyy-MM-dd', new Date())
            } else {
                if (full.indexOf('Z') < 0) full += '.000Z'
                d = new Date(full)
            }
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
            this.activeTab = 1
        }
    },
    watch: {
        datetimestr: function() {
            this.init()
        }
    }
}
</script>

<style scoped lang="scss">
.cancel, .ok {
    color: var(--v-secondary-base);
}
.v-dialog .v-card__text.nosurround {
    padding: 0 !important;
    margin: 0;
}
.v-card {
    ::v-deep .v-tabs-bar {
        height: 40px;
    }

    ::v-deep .v-picker__title {
        border-radius: 0 !important;
    }

    ::v-deep .v-window__container {
        min-height: 25rem;
    }
}
</style>
