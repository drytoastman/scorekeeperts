<template>
    <div class='unsubgrid'>
        <template v-for="listid in listids">
        <div :key="listid">
            {{listid}}
        </div>
        <div :key="listid+'1'">
            <v-icon v-if="unsubscribe.includes(listid)" color=red>{{close}}</v-icon>
            <v-icon v-else color=green>{{check}}</v-icon>
        </div>
        </template>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import { mdiClose, mdiCheck } from '@mdi/js'


export default {
    name: 'EmailGroups',
    data() {
        return {
            check: mdiCheck,
            close: mdiClose
        }
    },
    computed: {
        ...mapState(['listids', 'unsubscribe'])
    }
}
</script>

<style scoped>
.unsubgrid {
    display: inline-grid;
    grid-template-columns: 2fr 1fr 2fr 1fr;
}
.v-icon {
    margin-left: 2px;
    margin-right: 10px;
}
</style>
