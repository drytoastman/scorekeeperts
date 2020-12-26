<template>
    <div class="home">
        <div v-for="s in mergeservers" :key="s.serverid">
            <span>{{s.serverid}}</span>
            <span>{{s.hostname || s.address}}</span>
        </div>
        <v-data-table
            :headers="headers"
            :items="decoratedServers"
            hide-default-footer
            class="elevation-1"
        ></v-data-table>
        Below
    </div>
</template>

<script lang="ts">
import cloneDeep from 'lodash/cloneDeep'
import Vue from 'vue'
import { mapState } from 'vuex'

export default Vue.extend({
    name: 'Sync',
    data() {
        return {
            headers: [
                { text: 'name', value: 'hostname' },
                { text: 'last', value: 'mergestate.lastcheck' },
                { text: 'next', value: 'mergestate.lnextheck' },
                { text: 'nwacc2021', value: 'mergestate.nwacc2021.totalhash' }
            ]
        }
    },
    computed: {
        ...mapState(['mergeservers']),
        decoratedServers() {
            const ret = cloneDeep(this.mergeservers)
            for (const s of ret) {
                s.serieslist = Object.keys(s.mergestate)
            }
            return ret
        }
    },
    async mounted() {
        this.$store.dispatch('init')
    }
})

</script>
