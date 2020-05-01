<template>
    <v-container v-if="authenticated">
        <v-row no-gutters justify="center">
            <v-col>
            </v-col>
            <v-col class='flex-grow-0' align-self='center'>
                <span class='seriesname'>{{series}}</span>
            </v-col>
            <v-col>
                <v-select v-model="selected" :items="items" hide-details outlined style='min-width:8rem'></v-select>
            </v-col>
            <v-col>
            </v-col>
        </v-row>

        <v-row>
            <v-col v-if="!showevents">
                <CarCardsBox></CarCardsBox>
            </v-col>
            <v-col v-if="showevents">
                <EventsAccordian></EventsAccordian>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import { mapState } from 'vuex'
import CarCardsBox from '../../components/CarCardsBox'
import EventsAccordian from '../../components/EventsAccordian'

export default {
    name: 'SeriesSummary',
    components: {
        CarCardsBox,
        EventsAccordian
    },
    data: () => ({
        selected: 'Events',
        items: ['Cars', 'Events']
    }),
    computed: {
        ...mapState('register', ['cars', 'authenticated']),
        series: function () { return this.$route.params.series },
        showevents: function () { return this.selected === 'Events' }
    },
    mounted () {
        this.$store.dispatch('register/getdata', { series: this.$route.params.series })
    }
}
</script>

<style scoped>
.seriesname {
    font-weight: bold;
    font-size: 1.3rem;
    padding-right: 5px;
}
</style>
