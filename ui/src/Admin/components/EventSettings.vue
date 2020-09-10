<template>
    <v-expansion-panels multiple focusable hover accordion class='epanels'>
        <div class='adminbuttons'>
            <v-btn color="secondary" :disabled="unchanged" @click="reset">Reset</v-btn>
            <v-btn color="secondary" :disabled="unchanged" @click="saveSettings">Save</v-btn>
        </div>
        <v-expansion-panel>
            <v-expansion-panel-header>Name/Times/Notes</v-expansion-panel-header>
            <v-expansion-panel-content>
                <div class='basics'>
                    <v-text-field   v-model="eventm.name"       style="grid-area: name"      label="Event Name" :rules="vrules.name" ></v-text-field>
                    <DateTimePicker v-model="eventm.date"       fieldstyle="grid-area: date" label="Date" dateOnly></DateTimePicker>
                    <v-text-field   v-model="eventm.attr.location" style="grid-area: loc"      label="Location" :rules="vrules.location"></v-text-field>
                    <DateTimePicker v-model="eventm.regopened"  fieldstyle="grid-area: rego" label="Registration Opens"></DateTimePicker>
                    <DateTimePicker v-model="eventm.regclosed"  fieldstyle="grid-area: regc" label="Registration Closes"></DateTimePicker>
                    <div style="grid-area: notes">
                        <label class='noteslabel'>Notes (HTML)</label>
                        <div><PrismEditor v-model="eventm.attr.notes" :highlight="html"></PrismEditor></div>
                    </div>
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
    </v-expansion-panels>
</template>

<script>
import cloneDeep from 'lodash/cloneDeep'
import isEqual from 'lodash/isEqual'
import { PrismEditor } from 'vue-prism-editor'
import { prismlangs } from '@/util/prismwrapper'
import { EventValidator } from '@/common/event'
import DateTimePicker from '@/components/DateTimePicker'

export default {
    name: 'SettingsForm',
    props: {
        seriesevent: Object
    },
    components: {
        DateTimePicker,
        PrismEditor
    },
    data() {
        return {
            eventm: { attr: {}},
            vrules: EventValidator,
            regtypes: [
                { text: 'Standard Event with Classes', value: 0 },
                { text: 'AM/PM Registration (no classes)', value: 1 },
                { text: 'Day Registration (no classes)', value: 2 }
            ]
        }
    },
    computed: {
        unchanged() { return isEqual(this.seriesevent, this.eventm) },
        noclassesevent() { return this.eventm.regtype !== 0 }
    },
    methods: {
        ...prismlangs,
        saveSettings() {
            this.$store.dispatch('setdata', {
                type: 'update',
                items: { events: [this.eventm] }
            })
        },
        reset() {
            this.eventm = cloneDeep(this.seriesevent)
        }
    },
    watch: {
        seriesevent() { this.reset() },
        'eventm.regtype': function() {
            if (this.eventm.regtype !== 0) {
                this.eventm.ispractice = true
                this.eventm.useastiebreak = false
                this.eventm.champrequire = false
                this.eventm.isexternal = false
                this.eventm.ispro = false
            }
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

.noteslabel {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.6);
}

.epanels >>> code {
    white-space: pre-wrap;
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
