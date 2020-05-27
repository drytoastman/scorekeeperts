<template>
    <div>
        <div class='title'>Email Groups</div>
        <div class='unsubgrid'>
            <template v-for="listid in listids">
            <div :key="listid">
                {{listid}}
                <v-icon v-if="unsubscribe.includes(listid)" color=red>{{close}}</v-icon>
                <v-icon v-else color=green>{{check}}</v-icon>
            </div>
            </template>
        </div>
        <slot>
        </slot>
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
    column-count: 2;
}
.v-icon {
    margin-left: 2px;
}
</style>
