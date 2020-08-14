<template>
    <div class='outer'>
        <v-slider v-model="lines" class="align-center" :max="100" :min="10" hide-details>
            <template v-slot:append><span style='white-space:nowrap'>{{lines}} Lines</span></template>
        </v-slider>
        <div class='controls'>
            <v-btn @click='reload'>Reload</v-btn>
            <a :href="links" download>Download All Separate</a>
            <a :href="linki" download>Download All Interleaved</a>
        </div>

        <div class='log' v-for="name in Object.keys(logs).sort()" :key="name">
            <div class='name'>{{name}}</div>
            <div class='text' v-for="line in logs[name].split('\n')" :key="line[-1]">{{line}}</div>
        </div>
    </div>
</template>

<script>
import { API2ROOT } from '@/store/state'

export default {
    name: 'Summary',
    props: {
        series: String
    },
    data() {
        return {
            logs: {},
            lines: 20,
            links: API2ROOT + '/logs?separate',
            linki: API2ROOT + '/logs?interleave'
        }
    },
    methods: {
        reload() {
            this.$store.dispatch('getLogs', { lines: this.lines }).then(data => { this.logs = data })
        }
    },
    mounted() {
        this.reload()
    }
}
</script>

<style scoped>
.outer {
    width: 90vw;
}
.controls {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    align-items: center;
    justify-items: center;
    column-gap: 1rem;
}
.name {
    font-weight: bold;
    margin-top: 1rem;
    border-bottom: 1px solid lightgray;
}
.text {
    font-family: 'Courier New', Courier, monospace;
    white-space: nowrap;
}
</style>
