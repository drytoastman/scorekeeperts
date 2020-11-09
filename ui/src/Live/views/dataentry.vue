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
import { mapState } from 'vuex'
import isEmpty from 'lodash/isEmpty'
import ClassTable from '../components/ClassTable.vue'
import ChampTable from '../components/ChampTable.vue'
import EntrantTable from '../components/EntrantTable.vue'

export default {
    name: 'AnnouncerPanel',
    components: {
        ClassTable,
        ChampTable,
        EntrantTable
    },
    data() { return { isEmpty } },
    computed: { ...mapState(['last']) },
    mounted() {
        this.$store.dispatch('setWatch', {
            entrant:  true,
            class:    true,
            champ:    true
        })
    }
}
</script>

<style lang="scss" scoped>
.res {
    font-size: 90%;
    margin-bottom: 1rem;
}
</style>
