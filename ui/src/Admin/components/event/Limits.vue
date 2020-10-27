<template>
    <v-form ref='form'>
    <div class='limits'>
        <v-select     v-model="eventm.regtype"  style="grid-area: regt" label="Registration Type" :items="regtypes"></v-select>
        <v-text-field v-model="eventm.perlimit" style="grid-area: plim" :rules="vrules.perlimit" label="Person Limit" :disabled="noclassesevent"></v-text-field>
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
    </v-form>
</template>

<script>
import { EventValidator, REGTYPE_AMPM, REGTYPE_DAY, REGTYPE_STANDARD } from '@/common/event'

export default {
    name: 'LimitSettings',
    props: {
        eventm: Object
    },
    data() {
        return {
            vrules: EventValidator,
            regtypes: [
                { text: 'Standard Event with Classes', value: 0 },
                { text: 'AM/PM Registration (no classes)', value: 1 },
                { text: 'Day Registration (no classes)', value: 2 }
            ]
        }
    },
    computed: {
        noclassesevent() { return this.eventm.regtype !== 0 }
    },
    watch: {
        'eventm.regtype': function() {
            if (this.eventm.regtype !== REGTYPE_STANDARD) {
                this.eventm.ispractice = true
                this.eventm.useastiebreak = false
                this.eventm.champrequire = false
                this.eventm.isexternal = false
                this.eventm.ispro = false
                if (this.eventm.regtype === REGTYPE_AMPM) this.eventm.perlimit = 2
                if (this.eventm.regtype === REGTYPE_DAY)  this.eventm.perlimit = 1
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.limits {
    display: grid;
    column-gap: 2rem;
    grid-template-columns: repeat(5, 1fr);
    grid-template-areas:
        "regt regt regt plim tlim "
        "checks checks checks checks checks "
    ;

    @media (max-width: 560px) {
        display: grid;
        column-gap: 2rem;
        grid-template-columns: repeat(2, 1fr);
        grid-template-areas:
            "regt regt "
            "plim tlim "
            "checks checks "
        ;
    }

    .checks {
        grid-area: checks;
        display: flex;
        flex-wrap: wrap;

        & > * {
            width: 15rem;
        }

        .v-input--is-disabled ::v-deep .v-messages__message {
            opacity: 0.4;
        }
    }
}
</style>
