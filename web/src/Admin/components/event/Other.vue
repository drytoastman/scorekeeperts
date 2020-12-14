<template>
    <!-- eslint-disable vue/no-mutating-props -->
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
</template>

<script>
import { EventValidator } from '@sctypes/event'

export default {
    name: 'OtherSettings',
    props: {
        eventm: Object
    },
    data() {
        return {
            vrules: EventValidator
        }
    }
}
</script>

<style scoped>
.other {
    display: grid;
    column-gap: 2rem;
    grid-template-columns: repeat(4, 1fr);
    grid-template-areas:
        "chair chair host host"
        "spon spon course run"
        "cone gate count slim"
    ;

    @media (max-width: 560px) {
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
