<template>
  <v-data-table :items="itemsList" :headers="headers" item-key="name" class='itemstable'
                 disable-pagination hide-default-header hide-default-footer dense
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
import { mapState } from 'vuex'
import { mdiPencil, mdiDelete } from '@mdi/js'

export default {
    name: 'Accounts',
    props: {
        accountid: String
    },
    data() {
        return {
            icons: {
                mdiPencil,
                mdiDelete
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
        itemsList() { return this.paymentitems.filter(i => i.accountid === this.accountid) }
    }
}
</script>

<style scoped>
</style>
