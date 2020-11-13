<template>
    <v-app fluid>
        <v-app-bar dark color="primary">
            <v-img :src=cone max-height=40 max-width=40></v-img>
            <div class='header'>Scorekeeper Results</div>
            <div class='menus'>
                <v-select :items="yearlist"   background-color="primary" hide-details v-model="year"></v-select>
                <v-select :items="serieslist" background-color="primary" hide-details v-model="series"></v-select>
                <v-select :items="eventlist"  background-color="primary" hide-details v-model="eventid" v-if="series"></v-select>
            </div>
        </v-app-bar>

        <v-main>
             {{$route.name}} {{$route.params}}
            <router-view/>
        </v-main>
        <SnackBar></SnackBar>
    </v-app>
</template>


<script>
import SnackBar from '@/components/SnackBar.vue'
import cone from '@/../public/images/cone.png'

export default {
    name: 'Results',
    components: {
        SnackBar
    },
    data() {
        return  {
            cone,
            year: 0,
            // series: '',
            // eventid: '',
            yearlist: [2020, 2019, 2018, 2017],
            // serieslist: ['seriesa', 'seriesb', 'pro2019', 'other'],
            eventlist: ['eventa', 'eetnasd', 'blah c']
        }
    },
    computed: {
        series: {
            get() { return this.$route.params.series },
            set(nv) { this.$router.push({ name: 'series', params: { series: nv }}) }
        },
        eventid: {
            get() { return this.$route.params.eventid },
            set(nv) { this.$router.push({ name: 'eventindex', params: { eventid: nv }}) }
        },
        serieslist() {
            const rs = this.$route.params.series
            const ret = ['seriesa', 'seriesb', 'pro2019', 'other']
            if (rs && !ret.includes(rs)) {
                ret.push(rs)
            }
            return ret
        }
    }
}
</script>

<style lang="scss" scoped>
.header {
    margin-left: 1rem;
    margin-right: 1rem;
}

.menus {
    display: flex;
    justify-content: space-evenly;
    flex-grow: 0;
    column-gap: 2px;
    z-index: 100;
    .v-select {
        min-width: 5rem;
    }
    ::v-deep .v-select.v-text-field input {
        max-width: 5px;
    }
    ::v-deep .v-text-field .v-input__control .v-input__slot {
        &::before, &::after {
            border: none;
        }
    }
}

.v-sheet.v-app-bar {
    height: initial !important;
    flex-grow: 0;
}

::v-deep .v-toolbar__content {
    flex-wrap: wrap;
    height: initial !important;
}

</style>

<style lang="scss">
@import '@/styles/live.scss';
</style>
