<template>
  <v-data-table :items="itemsList" :headers="headers" item-key="name" class='itemstable'
                 disable-pagination hide-default-footer dense
  >
    <template v-slot:item.price="{ item }">
        {{item.price|dollars}}
    </template>

    <template v-slot:item.actions="{ item }">
        <v-icon small @click="$emit('edititem', item)">{{icons.mdiPencil}}</v-icon>
        <v-icon small @click="$emit('deleteitem', item)">{{icons.mdiDelete}}</v-icon>
    </template>

  </v-data-table>
</template>

<script>
import _ from 'lodash'
import { mapState } from 'vuex'
import { mdiPencil, mdiDelete, mdiPlus } from '@mdi/js'

export default {
    name: 'Accounts',
    props: {
    },
    data() {
        return {
            icons: {
                mdiPencil,
                mdiDelete,
                mdiPlus
            },
            headers: [
                { text: 'Name', value: 'name' },
                { text: 'Price', value: 'price' },
                { text: 'Actions', value: 'actions', sortable: false }
            ]
        }
    },
    computed: {
        ...mapState(['paymentitems']),
        itemsList() { return  _.orderBy(this.paymentitems, 'name') }
    }
}
</script>

<style scoped>
.addwrap {
    text-align: right;
    padding: 10px;
}
</style>
