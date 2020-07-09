<template>
    <v-expansion-panels multiple focusable hover accordion class='epanels'>
        <h2>Settings</h2>
        <div class='buttons'>
            <v-btn style='grid-area: reset' color="secondary" :disabled="unchanged" @click="reset">Reset</v-btn>
            <v-btn style='grid-area: save'  color="secondary" :disabled="unchanged" @click="saveSettings">Save</v-btn>
        </div>
        <v-expansion-panel>
            <v-expansion-panel-header>Basics</v-expansion-panel-header>
            <v-expansion-panel-content>
                <div class='basics'>
                    <v-text-field   v-model="eventm.name"       style="grid-area: name"      label="Event Name" :rules="vrules.name" ></v-text-field>
                    <DateTimePicker v-model="eventm.date"       fieldstyle="grid-area: date" label="Date" dateOnly></DateTimePicker>
                    <v-text-field v-model="eventm.attr.location" style="grid-area: loc"      label="Location" :rules="vrules.location"></v-text-field>
                    <DateTimePicker v-model="eventm.regopened"  fieldstyle="grid-area: rego" label="Registration Opens"></DateTimePicker>
                    <DateTimePicker v-model="eventm.regclosed"  fieldstyle="grid-area: regc" label="Registration Closes"></DateTimePicker>
                    <v-textarea     v-model="eventm.attr.notes" style="grid-area: notes"     label="Notes" :rules="vrules.notes" outlined></v-textarea>
                </div>
            </v-expansion-panel-content>
        </v-expansion-panel>

        <v-expansion-panel>
            <v-expansion-panel-header>Type/Limits</v-expansion-panel-header>
            <v-expansion-panel-content>
                <div class='limits'>
                    <v-select     v-model="eventm.regtype"  style="grid-area: regt" label="Registration Type" :items="regtypes"></v-select>
                    <v-text-field v-model="eventm.perlimit" style="grid-area: plim" :rules="vrules.perlimit" label="Person Limit"></v-text-field>
                    <v-text-field v-model="eventm.totlimit" style="grid-area: tlim" :rules="vrules.totlimit" label="Event Limit"></v-text-field>

                    <div class="checks">
                        <v-checkbox v-model="eventm.ispractice"    style="grid-area: prac"  label="No Championship Points"
                                messages="Schools/Practices/etc."                             :disabled="noclassesevent"></v-checkbox>
                        <v-checkbox v-model="eventm.useastiebreak" style="grid-area: tieb"  label="Championship Tie Breaker"
                                messages="Prepend to list of tie breakers"                    :disabled="noclassesevent"></v-checkbox>
                        <v-checkbox v-model="eventm.champrequire"  style="grid-area: chmp"  label="Championship Requirement"
                                messages="Attendance required to qualify, uncommon"           :disabled="noclassesevent"></v-checkbox>
                        <v-checkbox v-model="eventm.isexternal"    style="grid-area: extn"  label="External Results"
                                messages="Used for including National events in championship" :disabled="noclassesevent"></v-checkbox>
                        <v-checkbox v-model="eventm.ispro"         style="grid-area: pro"   label="ProSolo Event" :disabled="noclassesevent"></v-checkbox>
                    </div>
                </div>
            </v-expansion-panel-content>
        </v-expansion-panel>

        <v-expansion-panel>
            <v-expansion-panel-header>Payments</v-expansion-panel-header>
            <v-expansion-panel-content>
                <div class='payments'>
                    <v-select v-model="eventm.accountid" style="grid-area: acct"  label="Payment Account" :items="acctlist" item-value="accountid" item-text="name"></v-select>
                    <v-checkbox v-model="eventm.attr.paymentreq" style="grid-area: preq" label="Payment Required"></v-checkbox>

                    <v-combobox v-model="eventitems" style="grid-area: pitem" :items="itemlist"
                                item-value="itemid" item-text="name" label="Payment Items" multiple chips deletable-chips outlined>
                        <template v-slot:item="{ item }">
                            {{item.name}} - {{item.price|cents2dollars}}
                        </template>
                    </v-combobox>
                </div>
            </v-expansion-panel-content>
        </v-expansion-panel>

        <v-expansion-panel>
            <v-expansion-panel-header>Other</v-expansion-panel-header>
            <v-expansion-panel-content>
                <div class='other'>
                    <v-text-field v-model="eventm.attr.sponsor"  style="grid-area: spon"  label="Sponsor"></v-text-field>
                    <v-text-field v-model="eventm.attr.host"     style="grid-area: host"  label="Host"></v-text-field>
                    <v-text-field v-model="eventm.attr.chair"    style="grid-area: chair" label="Chair"></v-text-field>

                    <v-text-field v-model="eventm.courses"     style="grid-area: course" label="Courses"></v-text-field>
                    <v-text-field v-model="eventm.runs"        style="grid-area: run"    label="Runs"></v-text-field>
                    <v-text-field v-model="eventm.countedruns" style="grid-area: count"  label="Runs Counted" messages="0 for all runs"></v-text-field>
                    <!-- <v-text-field v-model="eventm.segments"    style="grid-area: seg"    label="Segments"></v-text-field> -->
                    <v-text-field v-model="eventm.conepen"     style="grid-area: cone"   label="Cone Penalty"></v-text-field>
                    <v-text-field v-model="eventm.gatepen"     style="grid-area: gate"   label="Gate Penalty"></v-text-field>
                    <v-text-field v-model="eventm.sinlimit"    style="grid-area: slim"   label="Singles Entry Limit"
                                        messages="Limit of unique entrants, rare"></v-text-field>
                </div>
            </v-expansion-panel-content>
        </v-expansion-panel>

        <div class='buttons'>
            <v-btn style='grid-area: reset' color="secondary" :disabled="unchanged" @click="reset">Reset</v-btn>
            <v-btn style='grid-area: save'  color="secondary" :disabled="unchanged" @click="saveSettings">Save</v-btn>
        </div>
    </v-expansion-panels>
</template>

<script>
import _ from 'lodash'
import { mapState } from 'vuex'
import { EventValidator } from '@common/lib'
import DateTimePicker from '../../components/DateTimePicker'

export default {
    name: 'SettingsForm',
    props: {
        event
    },
    components: {
        DateTimePicker
    },
    data() {
        return {
            eventm: { attr: {} },
            eventitems: [],
            vrules: EventValidator,
            regtypes: [
                { text: 'Standard Event with Classes', value: 0 },
                { text: 'AM/PM Registration (no classes)', value: 1 },
                { text: 'Day Registration (no classes)', value: 2 }
            ]
        }
    },
    computed: {
        ...mapState(['paymentaccounts', 'paymentitems']),
        unchanged() { return _.isEqual(this.event, this.eventm) },
        acctlist() { return Object.values(this.paymentaccounts) },
        itemlist() { return _(this.paymentitems).values().orderBy('name').value() },
        noclassesevent() { return this.eventm.regtype !== 0 }
    },
    methods: {
        saveSettings() {
            this.$store.commit('gettingData', true)
            this.$store.dispatch('setdata', {
                type: 'update',
                items: { events: [this.eventm] }
            }).then(() => this.$store.commit('gettingData', false))
        },
        reset() {
            this.eventm = _.cloneDeep(this.event)
            // v-combobox only sets/returns object so create object list here
            this.eventitems = this.event.items.map(itemid => this.paymentitems[itemid])
        }
    },
    watch: {
        event() { this.reset() },
        'eventm.regtype': function() {
            if (this.eventm.regtype !== 0) {
                this.eventm.ispractice = true
                this.eventm.useastiebreak = false
                this.eventm.champrequire = false
                this.eventm.isexternal = false
                this.eventm.ispro = false
            }
        },
        eventitems() {
            // v-combobox only sets/returns object so copy back to item list here
            this.eventm.items = this.eventitems.map(ei => ei.itemid)
        }
    },
    mounted() { this.reset() }
}
</script>

<style scoped>

.v-expansion-panel-header {
    border-bottom: 1px solid rgb(184, 184, 184);
}

.epanels >>> .v-expansion-panel-content__wrap {
    padding-top: 1rem;
}
.epanels >>> .v-messages__message {
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
.v-expansion-panel-header {
    font-weight: bold;
    font-size: 110%;
}

.basics {
    display: grid;
    column-gap: 2rem;
    grid-template-columns: repeat(6, 1fr);
    grid-template-areas:
        "name name date date loc loc "
        "rego rego rego regc regc regc "
        "notes notes notes notes notes notes  "
}

.limits {
    display: grid;
    column-gap: 2rem;
    grid-template-columns: repeat(5, 1fr);
    grid-template-areas:
        "regt regt regt plim tlim "
        "checks checks checks checks checks "
    ;
}

.payments {
    display: grid;
    column-gap: 2rem;
    grid-template-columns: repeat(6, 1fr);
    grid-template-areas:
        "acct acct acct acct preq preq "
        "pitem pitem pitem pitem pitem pitem "
    ;
}

.other {
    display: grid;
    column-gap: 2rem;
    grid-template-columns: repeat(4, 1fr);
    grid-template-areas:
        "chair chair host host"
        "spon spon course run"
        "cone gate count slim"
    ;
}

.checks {
    grid-area: checks;
    display: flex;
    flex-wrap: wrap;
}
.checks > * {
    width: 15rem;
}
.checks .v-input--is-disabled >>> * {
    color: rgba(0,0,0,0.15);
}

.buttons {
    margin: 1rem;
    display: grid;
    column-gap: 1rem;
    grid-template-columns: 1fr 1fr;
    grid-template-areas: "save reset";
    width: 100%;
}

@media (max-width: 560px) {
    .epanels >>> .v-messages__message {
        white-space: nowrap;
    }

    .basics {
        display: block;
    }

    .limits {
        display: grid;
        column-gap: 2rem;
        grid-template-columns: repeat(2, 1fr);
        grid-template-areas:
            "regt regt "
            "plim tlim "
            "checks checks "
        ;
    }

    .other {
        display: grid;
        column-gap: 2rem;
        grid-template-columns: repeat(2, 1fr);
        grid-template-areas:
            "loc loc "
            "chair chair "
            "host host "
            "spon spon "
            "course run "
            "count slim "
            "cone gate "
        ;
    }
}
</style>
