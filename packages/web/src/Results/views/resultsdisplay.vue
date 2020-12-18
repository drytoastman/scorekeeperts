<template>
    <div>
        <div class='eventheader' v-if="type === 'event' && event.date">
            <div v-if="settings.resultsheader" v-html="processedHeader">
            </div>
            <div v-else>
                <div class='eventname'>
                    <span class='name'>{{event.name}}</span>
                    <span class='date'>{{event.date|dmdy}}</span>
                </div>
                <div class='seriesname'>
                    {{settings.seriesname}}
                </div>
                <div class='eventinfo'>
                    <span class='location' v-if="event.location">{{event.location}}</span>
                    <span class='entrantcount'>{{entrantcount}} Entrants</span>
                </div>
            </div>
        </div>
        <div v-else class='stitle'>
            {{title}}
        </div>

        <ClassTable :classcodes="usecodes"></ClassTable>
        <TopTimesTable v-if="seriesinfo.events" :table="tttable"></TopTimesTable>
    </div>
</template>

<script>
import orderBy from 'lodash/orderBy'
import { mapGetters, mapState } from 'vuex'

import ClassTable from '../components/standard/ClassTable.vue'
import TopTimesTable from '../components/standard/TopTimesTable.vue'
import { createTopTimesTable } from 'sctypes/lib/toptimes'
import { ClassData } from 'sctypes/lib/classindex'
import { dmdy } from '@/util/filters'

export default {
    name: 'ResultsDisplay',
    components: {
        ClassTable,
        TopTimesTable
    },
    props: {
        codes:   Array,
        groups:  Array,
        eventid: String
    },
    computed: {
        ...mapState(['seriesinfo', 'eventresults']),
        ...mapGetters(['classesForGroups', 'resultsClasses', 'eventInfo']),
        type() {
            if (this.codes  && this.codes.length)  return 'bycode'
            if (this.groups && this.groups.length) return 'bygroup'
            return 'event'
        },
        settings() {
            return this.seriesinfo.settings || {}
        },
        event() {
            return this.eventInfo(this.eventid)
        },
        entrantcount() {
            return Object.values(this.eventresults).map(clist => clist.length).reduce((acc, cur) => acc + cur, 0)
        },
        classdata() {
            return new ClassData(this.seriesinfo.classes, this.seriesinfo.indexes)
        },
        usecodes() {
            return orderBy(this.filteredcodes, v => v)
        },
        filteredcodes() {
            switch (this.type) {
                case 'bycode':  return this.codes
                case 'bygroup': return this.classesForGroups(this.groups.map(s => parseInt(s)))
                case 'event':   return this.resultsClasses
            }
            return []
        },
        title() {
            switch (this.type) {
                case 'bycode':  return ''
                case 'bygroup': return `Group ${this.groups.join(', ')}`
                case 'event':   return 'Event Results'
            }
            return ''
        },
        tttable() {
            if (this.type !== 'event') return {}
            const keys = []
            keys.push({ indexed: 1, counted: 1 })
            keys.push({ indexed: 0, counted: 1 })
            return createTopTimesTable(this.classdata, this.eventresults, keys)
        },
        processedHeader() {
            /* eslint-disable indent */
            // not using live compiler templates so we do our own limited interpolation
            return this.settings.resultsheader
                        .replace('EVENTNAME', this.event.name)
                        .replace('EVENTDATE', dmdy(this.event.date))
                        .replace('SERIESNAME', this.settings.seriesname)
                        .replace('LOCATION', this.event.location)
                        .replace('COUNT', this.entrantcount)
            /* eslint-enable indent */
        }
    }
}
</script>

<style lang="scss">
.eventheader {
    .eventname {
        color: var(--headerColor);
        display: flex;
        justify-content: center;
        align-items: baseline;
        column-gap: 1rem;
        .name {
            font-size: 150%;
            font-weight: bold;
        }
        .date {
            font-size: 120%;
        }
    }

    .seriesname {
        text-align: center;
        color: #112;
        font-size: 120%;
    }

    .eventinfo {
        text-align: center;
        display: flex;
        justify-content: center;
        column-gap: 1rem;
        // .location {}
        .entrantcount {
            font-style: italic;
        }
    }

    text-align: center;
    margin-bottom: 0.5rem;
}
</style>

<style lang="scss" scoped>
.stitle {
    text-align: center;
    color: var(--headerColor);
    font-size: 140%;
    font-weight: bold;
    margin-bottom: 0.5rem;
}
</style>
