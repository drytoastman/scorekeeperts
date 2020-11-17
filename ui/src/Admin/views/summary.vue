<template>
    <div class='inset'>
        <div v-if="series">
            <h2>{{series}}</h2>
            <div v-for="e in Object.values(this.$store.state.events)" :key="e.eventid">
                <span class='date'>{{format(e.date)}}</span> {{e.name}}
            </div>
        </div>
        <div v-else>
            Select a series above...
        </div>
    </div>
</template>

<script>
import { parseDate } from '@/common/util'
import { format } from 'date-fns'

export default {
    name: 'Summary',
    props: {
        series: String
    },
    methods: {
        format(date) {
            return format(parseDate(date), 'EEE MMM dd Y')
        }
    }
}
</script>

<style scoped>
.date {
    display: inline-block;
    width: 8rem;
    margin-left: 1rem;
    margin-right: 1rem;
    text-align: right;
}
</style>
