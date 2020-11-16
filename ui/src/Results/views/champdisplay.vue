<template>
    <div>
        <h2 class='seriesname'>{{seriesname}} Championship Points</h2>
        <div v-if="requirements.length" class='minwarning'>
            <b>Requirements to Place:</b> <span>{{requirements.join(", ")}}</span>
        </div>

        <ChampTable v-if="seriesinfo.events"></ChampTable>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import ChampTable from '../components/standard/ChampTable.vue'

export default {
    name: 'ChampDisplay',
    components: {
        ChampTable
    },
    computed: {
        ...mapState(['seriesinfo']),
        seriesname() { return this.seriesinfo.settings?.seriesname },
        requirements() {
            if (!this.seriesinfo.events) return []
            const require = this.seriesinfo.events.filter(e => !e.ispractice && e.champrequire).map(e => `Attend ${e.name}`)
            if (this.seriesinfo.settings.minevents > 0) {
                require.push(`Attend At Least ${this.seriesinfo.settings.minevents} Events`)
            }
            return require
        }
    }
}
</script>

<style lang="scss" scoped>
h2 {
    color: #556;
    text-align: center;
}
.minwarning {
    text-align: center;
}
.champ {
    margin-top: 1rem;
}
</style>
