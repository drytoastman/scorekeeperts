<template>
    <v-expansion-panels multiple focusable hover accordion v-model="panels" class='epanels'>
        <div class='inset'>
            <h2 class='title'>New Events Template</h2>
            <div class='desc'>
                Add event names and dates at the start, followed by guides for opening and closing registration.
                The rest of the inputs will be copied to each event, you can modify them individually later.
                Click Create at the bottom to actually create the events.
            </div>
        </div>

        <v-expansion-panel>
            <v-expansion-panel-header>Basics</v-expansion-panel-header>
            <v-expansion-panel-content eager>
                <BasicsTemplate :eventm="eventm" @count="count=$event" ref='template'></BasicsTemplate>
            </v-expansion-panel-content>
        </v-expansion-panel>

        <v-expansion-panel>
            <v-expansion-panel-header>Payments</v-expansion-panel-header>
            <v-expansion-panel-content eager>
                <Payments :eventm="eventm" :uiitems="uiitems"></Payments>
            </v-expansion-panel-content>
        </v-expansion-panel>

        <v-expansion-panel>
            <v-expansion-panel-header>Type/Limits</v-expansion-panel-header>
            <v-expansion-panel-content eager>
                <Limits :eventm="eventm" ref='limits'></Limits>
            </v-expansion-panel-content>
        </v-expansion-panel>

        <v-expansion-panel>
            <v-expansion-panel-header>Other</v-expansion-panel-header>
            <v-expansion-panel-content eager>
                <Other :eventm="eventm"></Other>
            </v-expansion-panel-content>
        </v-expansion-panel>

        <div>
            <v-btn class='createbutton' color="secondary" :disabled="!count" @click="createEvents">Create {{count}} Event{{count > 1 ? 's':''}}</v-btn>
        </div>
    </v-expansion-panels>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { subDays } from 'date-fns'

import { parseDate, parseTimestamp } from '@sctypes/util'
import BasicsTemplate from './BasicsTemplate.vue'
import Limits from './Limits.vue'
import Other from './Other.vue'
import Payments from './Payments.vue'
import cloneDeep from 'lodash/cloneDeep'

export default {
    name: 'NewEvents',
    components: {
        BasicsTemplate,
        Limits,
        Other,
        Payments
    },
    data() {
        return {
            panels: [0, 1, 2, 3],
            count: 1,
            eventm: {
                regtype: 0,
                perlimit: 2,
                totlimit: 0,
                sinlimit: 0,
                courses: 1,
                runs: 4,
                conepen: 2.0,
                gatepen: 10.0,
                countedruns: 0,
                accountid: null,
                items: [],
                attr: {},
                ispro: false,
                ispractice: false,
                isexternal: false,
                champrequire: false,
                useastiebreak: false,
                segments: 0
            },
            uiitems: []
        }
    },
    computed: {
        ...mapState(['paymentitems']),
        ...mapGetters(['eventUIItems'])
    },
    methods: {
        createOpening(datestring, opendays) {
            return subDays(parseDate(datestring), opendays).toISOString()
        },
        createClosing(datestring, prevdow, timestampstring) {
            const date     = parseDate(datestring)
            const adj      = date.getDay() - prevdow
            const timebase = parseTimestamp(timestampstring)

            const ret = subDays(date, adj <= 0 ? adj + 7 : adj)
            ret.setHours(timebase.getHours(), timebase.getMinutes())
            return ret.toISOString()
        },
        createEvents() {
            if (!(this.$refs.template.$refs.form.validate() && this.$refs.limits.$refs.form.validate())) {
                this.$store.commit('addErrors', ['there is an error in the form'])
                return
            }

            const data = this.$refs.template.events
            const events = []
            for (const e of data.namedays) {
                const emod = cloneDeep(this.eventm)
                emod.name = e.name
                emod.date = e.date
                emod.attr.location = e.location
                emod.regopened = this.createOpening(e.date, data.opendays)
                emod.regclosed = this.createClosing(e.date, data.closeday, data.closetime)
                emod.items     = this.uiitems.filter(m => m.checked).map(m => m.map)
                events.push(emod)
            }
            this.$store.dispatch('setdata', {
                type: 'insert',
                items: { events: events }
            }).then(data => {
                if (data) this.$router.push({ name: 'summary' })
            })
        },
        setupEventItems() {
            this.uiitems = this.eventUIItems()
        }
    },
    watch: { paymentitems() { this.setupEventItems() } },
    mounted() { this.setupEventItems() }
}
</script>

<style scoped lang='scss'>
.desc {
    margin-bottom: 1rem;
}

.v-expansion-panel-header {
    border-bottom: 1px solid rgb(184, 184, 184);
}

.epanels ::v-deep .v-expansion-panel-content__wrap {
    padding-top: 1rem;
}
.epanels ::v-deep .v-messages:not(.error--text) .v-messages__message {
    font-style: italic;
    color: var(--v-secondary-darken2);
}
.epanels {
    max-width: 1300px;
}
.epanels h2 {
    font-size: 130%;
    text-align: left;
    width: 100%;
}
.v-expansion-panel {
    @media (max-width: 800px) {
        margin-left: -1rem;
        margin-right: -1rem;
        xpadding-right: 0;
    }
}
.v-expansion-panel-header {
    font-weight: bold;
    font-size: 110%;
}

.createbutton {
    width: 20rem;
    margin-top: 2rem;
}
</style>
