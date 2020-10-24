<template>
    <v-expansion-panels multiple focusable hover accordion v-model="panels" class='epanels'>
        <div class='adminbuttons'>
            <v-btn color="secondary" :disabled="unchanged" @click="reset">Reset</v-btn>
            <v-btn color="secondary" :disabled="unchanged" @click="saveSettings">Save</v-btn>
        </div>
        <v-expansion-panel>
            <v-expansion-panel-header>Name/Times/Notes</v-expansion-panel-header>
            <v-expansion-panel-content>
                <Basics :eventm="eventm"></Basics>
            </v-expansion-panel-content>
        </v-expansion-panel>

        <v-expansion-panel>
            <v-expansion-panel-header>Type/Limits</v-expansion-panel-header>
            <v-expansion-panel-content>
                <Limits :eventm="eventm"></Limits>
            </v-expansion-panel-content>
        </v-expansion-panel>

        <v-expansion-panel>
            <v-expansion-panel-header>Other</v-expansion-panel-header>
            <v-expansion-panel-content>
                <Other :eventm="eventm"></Other>
            </v-expansion-panel-content>
        </v-expansion-panel>
    </v-expansion-panels>
</template>

<script>
import cloneDeep from 'lodash/cloneDeep'
import isEqual from 'lodash/isEqual'
import Basics from './Basics.vue'
import Limits from './Limits.vue'
import Other from './Other.vue'

export default {
    name: 'SettingsForm',
    props: {
        seriesevent: Object
    },
    components: {
        Basics,
        Limits,
        Other
    },
    data() {
        return {
            panels: [0],
            eventm: { attr: {}}
        }
    },
    computed: {
        unchanged() { return isEqual(this.seriesevent, this.eventm) }
    },
    methods: {
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
        seriesevent() { this.reset() }
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
</style>
