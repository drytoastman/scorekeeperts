<template>
    <!-- eslint-disable vue/no-mutating-props -->
    <v-form ref='form'>
    <div class='basicst'>
        <div class='templates'>
            <div class='helptext'>Click + to add additional events and fill out their name, date and location</div>
            <div class='namelist'>
                <div v-for="(e, ii) in events.namedays" :key="ii" class='namedateloc'>
                    <v-btn class='index' icon small @click='removeevent(ii)'><v-icon>{{icons.mdiCloseBox}}</v-icon></v-btn>
                    <v-text-field   v-model="e.name"     label="Event Name" class='name' :rules="vrules.name"></v-text-field>
                    <DateTimePicker v-model="e.date"     label="Event Date" fieldclass='date' dateOnly :rules="[nonBlank]"></DateTimePicker>
                    <v-text-field   v-model="e.location" label="Location"   class='loc'  :rules="vrules.location"></v-text-field>
                </div>
                <v-btn fab small color="secondary" class='eventfab' @click="addevent">+</v-btn>
            </div>

            <div class='helptext'>Select the calculations for setting up times for registration opening and closing</div>
            <div class='otherrequirements'>
                <v-text-field   label="Open Reg * Days Before" :rules="[min1]"  v-model="events.opendays" validate-on-blur></v-text-field>
                <v-select       label="Close Day Before"       :items="days"  v-model="events.closeday"></v-select>
                <DateTimePicker label="Close Time" timeOnly   v-model="events.closetime" ></DateTimePicker>
            </div>
        </div>

        <div class='helptext'>The rest of the settings are copied the same into each event</div>
        <div>
            <label class='noteslabel'>Notes (HTML)</label>
            <div><PrismEditor v-model="eventm.attr.notes" :highlight="html"></PrismEditor></div>
        </div>
    </div>
    </v-form>
</template>

<script>
import { mdiCloseBox } from '@mdi/js'
import { PrismEditor } from 'vue-prism-editor'
import { prismlangs } from '@/util/prismwrapper'
import { EventValidator } from '@sctypes/event'
import DateTimePicker from '@/components/DateTimePicker.vue'
import { Min, nonBlank } from '@sctypes/util'

export default {
    name: 'BasicSettings',
    props: {
        eventm: Object
    },
    components: {
        DateTimePicker,
        PrismEditor
    },
    data() {
        return {
            vrules: EventValidator,
            min1: Min(1),
            nonBlank: nonBlank,
            icons: {
                mdiCloseBox
            },
            days: [
                { value: 1, text: 'Mon' },
                { value: 2, text: 'Tue' },
                { value: 3, text: 'Wed' },
                { value: 4, text: 'Thu' },
                { value: 5, text: 'Fri' },
                { value: 6, text: 'Sat' },
                { value: 0, text: 'Sun' }
            ],
            events: {
                namedays: [
                    { name: '', date: '', location: '' }
                ],
                opendays: 30,
                closeday: 5,
                closetime: '2000-01-01 18:00'
            },
            headers: [
                { text: 'Code', value: 'indexcode' },
                { text: 'Desc', value: 'descrip', width: 250 },
                { text: 'Value', value: 'value', sortable: false },
                { text: 'Actions', value: 'actions', sortable: false }
            ]
        }
    },
    methods: {
        ...prismlangs,
        addevent() {
            this.events.namedays.push({ name: '', date: '', location: '' })
            this.$emit('count', this.events.namedays.length)
        },
        removeevent(ii) {
            this.events.namedays.splice(ii, 1)
            this.$emit('count', this.events.namedays.length)
        }
    }
}
</script>

<style lang="scss" scoped>
.templates {
    margin-bottom: 1rem;
}
.namelist {
    margin-bottom: 1rem;
}
.namedateloc {
    display: grid;
    column-gap: 1rem;
    grid-template-columns: 1rem 3fr 2fr 2fr;
    grid-template-areas: "index name date loc ";
    align-items: center;
    .index { grid-area: index };
    .name  { grid-area: name };
    ::v-deep .date  { grid-area: date };
    .loc   { grid-area: loc };
    @media (max-width: 800px) {
        grid-template-columns: 1rem 2fr 2fr;
        grid-template-areas: "index name name "
                             " .    date loc ";
    }
}

.eventfab {
    font-size: 130%;
    display: block;
    margin-left: auto;
    margin-top: -1rem;
}

.otherrequirements {
    display: grid;
    column-gap: 1rem;
    grid-template-columns: 1fr 1fr 1fr;
}

.helptext {
    font-size: 14px;
    text-align: center;
    color: var(--v-secondary-base);
}

.noteslabel {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.6);
}
</style>
