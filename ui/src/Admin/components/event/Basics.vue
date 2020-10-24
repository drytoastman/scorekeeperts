<template>
    <div class='basics'>
        <v-text-field   v-model="eventm.name"       style="grid-area: name"      label="Event Name" :rules="vrules.name" ></v-text-field>
        <DateTimePicker v-model="eventm.date"       fieldstyle="grid-area: date" label="Date" dateOnly></DateTimePicker>
        <v-text-field   v-model="eventm.attr.location" style="grid-area: loc"    label="Location" :rules="vrules.location"></v-text-field>
        <DateTimePicker v-model="eventm.regopened"  fieldstyle="grid-area: rego" label="Registration Opens"></DateTimePicker>
        <DateTimePicker v-model="eventm.regclosed"  fieldstyle="grid-area: regc" label="Registration Closes"></DateTimePicker>
        <div style="grid-area: notes">
            <label class='noteslabel'>Notes (HTML)</label>
            <div><PrismEditor v-model="eventm.attr.notes" :highlight="html"></PrismEditor></div>
        </div>
    </div>
</template>

<script>
import { PrismEditor } from 'vue-prism-editor'
import { prismlangs } from '@/util/prismwrapper'
import { EventValidator } from '@/common/event'
import DateTimePicker from '@/components/DateTimePicker'

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
            vrules: EventValidator
        }
    },
    methods: {
        ...prismlangs
    }
}
</script>

<style lang="scss" scoped>
.basics {
    display: grid;
    column-gap: 2rem;
    grid-template-columns: repeat(6, 1fr);
    grid-template-areas:
        "name name date date loc loc "
        "rego rego rego regc regc regc "
        "notes notes notes notes notes notes  ";

    @media (max-width: 560px) {
        display: block;
    }

    .noteslabel {
        font-size: 12px;
        color: rgba(0, 0, 0, 0.6);
    }

    ::v-deep code {
        white-space: pre-wrap;
    }
}
</style>
