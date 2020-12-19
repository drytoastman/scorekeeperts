<template>
  <v-data-table :items="itemsList" :headers="headers" item-key="itemid" class='itemstable'
                 disable-pagination hide-default-footer dense
  >
    <template v-slot:[`item.price`]="{ item }">
        {{item.price|cents2dollars}}
    </template>

    <template v-slot:[`item.itemtype`]="{ item }">
        {{itemtypes[item.itemtype].text}}
    </template>

    <template v-slot:[`item.actions`]="{ item }">
        <v-icon small @click="$emit('edititem', item)">{{icons.mdiPencil}}</v-icon>
        <v-icon small @click="$emit('deleteitem', item)">{{icons.mdiDelete}}</v-icon>
    </template>

  </v-data-table>
</template>

<script>
import orderBy from 'lodash/orderBy'
import { mapState } from 'vuex'
import { mdiPencil, mdiDelete, mdiPlus } from '@mdi/js'
import { ITEMTYPES } from 'sctypes/payments'

export default {
    name: 'ItemsTable',
    props: {
    },
    data() {
        return {
            icons: {
                mdiPencil,
                mdiDelete,
                mdiPlus
            },
            itemtypes: ITEMTYPES,
            headers: [
                { text: 'Name', value: 'name' },
                { text: 'Price', value: 'price' },
                { text: 'Type',  value: 'itemtype' },
                { text: 'Actions', value: 'actions', sortable: false }
            ]
        }
    },
    computed: {
        ...mapState(['paymentitems']),
        itemsList() { return  orderBy(this.paymentitems, ['itemtype', 'name']) }
    }
}
</script>

<style scoped>
.addwrap {
    text-align: right;
    padding: 10px;
}
</style>
