<template>
    <div class='panel'>
        <template v-if="!isEmpty(last)">
            <EntrantTable :entrant="last.entrant"></EntrantTable>
            <ClassTable       :cls="last.class" noindexcol nodiff1col></ClassTable>
            <ChampTable     :champ="last.champ"></ChampTable>
        </template>
        <template v-else>
            Waiting for data...
        </template>
    </div>
</template>

<script>
import isEmpty from 'lodash/isEmpty'
import ClassTable from '../components/live/ClassTable.vue'
import ChampTable from '../components/live/ChampTable.vue'
import EntrantTable from '../components/live/EntrantTable.vue'

export default {
    name: 'DataEntry',
    components: {
        ClassTable,
        ChampTable,
        EntrantTable
    },
    data() { return { isEmpty } },
    computed: {
        last() { return this.$store.state.live.last }
    },
    mounted() {
        this.$store.dispatch('setWatch', {
            entrant:  true,
            class:    true,
            champ:    true,
            course:   parseInt(this.$route.query.course)
        })
    }
}
</script>

<style lang="scss" scoped>
::v-deep .live {
    font-size: 80%;
    margin-bottom: 0.5rem;
}
</style>
