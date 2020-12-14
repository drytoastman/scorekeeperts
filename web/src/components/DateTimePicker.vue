<template>
  <v-dialog v-model="display" :width="340">
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
import { parseDate, parseTimestamp, formatToTimestamp } from '@sctypes/util'

const VDATE = 'yyyy-MM-dd'
const VTIME = 'HH:mm'

export default {
    name: 'v-datetime-picker',
    model: {
        prop: 'datetimestr',
        event: 'input'
    },
    props: {
        datetimestr: String,
        disabled: Boolean,
        label: String,
        fieldstyle: String,
        fieldclass: String,
        dateOnly: Boolean,
        timeOnly: Boolean,
        rules: Array
    },
    data() {
        return {
            display: false,
            activeTab: 0,
            date: '',
            time: ''
        }
    },
    computed: {
        displayedDateTime() {
            try {
                let fmt = 'EEE MMM dd y hh:mm a z'
                if (this.dateOnly) fmt = 'EEE MMM dd y'
                if (this.timeOnly) fmt = 'hh:mm a z'
                return format(this.combinedDate, fmt).replace(/GMT-8/, 'PST').replace(/GMT-7/, 'PDT')
            } catch (error) {
                return ''
            }
        },
        combinedDate() {
            const def = new Date()
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
            const d = (this.datetimestr.length === 10) ? parseDate(this.datetimestr) : parseTimestamp(this.datetimestr)
            this.date = format(d, VDATE)
            this.time = format(d, VTIME)
        },
        okHandler() {
            this.resetPicker()
            if (this.dateOnly) {
                this.$emit('input', this.date)
            } else {
                this.$emit('input', formatToTimestamp(this.combinedDate))
            }
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
