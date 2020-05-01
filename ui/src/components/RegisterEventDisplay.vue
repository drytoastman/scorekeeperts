<template>
    <v-container>
        <v-row>
            Closed: {{event.regclosed | timedate }}
        </v-row>
        <v-row v-if="event.location">
            Location: {{event.location}}
        </v-row>
        <v-row>
            Entries: {{counts.singles}}
        </v-row>
    </v-container>
</template>

<script>
export default {
    filters: {
        timedate: function (v) {
            const d = new Date(v)
            return d.toDateString() + ' - ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', timeZoneName: 'short' })
        }
    },
    props: {
        event: {
            type: Object, // SeriesEvent
            default: () => ({ attr: {} })
        },
        counts: {
            type: Object,
            default: () => ({})
        }
    },
    data: function () {
        return {}
    }
}
</script>
