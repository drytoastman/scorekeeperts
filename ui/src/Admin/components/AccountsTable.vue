<template>
    <div>
        <v-data-table
            :items="accountsList"
            :headers="headers"
            disable-pagination
            hide-default-footer
            :expanded.sync="expanded"
            show-expand
            item-key="name"
            class="accountstable"
        >
            <template v-slot:item.actions="{ item }">
                <v-icon small @click="editaccount(item)">{{icons.mdiPencil}}</v-icon>
                <v-icon small @click="deleteaccount(item)">{{icons.mdiDelete}}</v-icon>
            </template>

            <template v-slot:item.type="{ item }">
                <img v-if="item.type === 'square'" :src="icons.squareIcon" />
                <img v-else :src="icons.paypalIcon" />
            </template>

            <template v-slot:expanded-item="{ headers, item }">
                <td :colspan="headers.length">
                    <ItemsTable :accountid="item.accountid" @edititem="edititem" @deleteitem="deleteitem"></ItemsTable>
                </td>
            </template>
        </v-data-table>

        <ItemDialog :item="dialogData" :apiType="dialogApiType" v-model="itemDialog"></ItemDialog>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import { mdiPencil, mdiDelete } from '@mdi/js'
import squareIcon from '../../images/square.svg'
import paypalIcon from '../../images/paypal.svg'
import ItemsTable from './ItemsTable'
import ItemDialog from './ItemDialog'

export default {
    name: 'Accounts',
    components: {
        ItemsTable,
        ItemDialog
    },
    data() {
        return {
            expanded: [],
            dialogData: {},
            dialogApiType: '',
            itemDialog: false,
            icons: {
                mdiPencil,
                mdiDelete,
                squareIcon,
                paypalIcon
            },
            headers: [
                { text: 'Name', value: 'name' },
                { text: 'Type', value: 'type' },
                { text: 'Actions', value: 'actions', sortable: false },
                { text: 'Items', value: 'data-table-expand' }
            ]
        }
    },
    computed: {
        ...mapState(['paymentaccounts', 'paymentitems']),
        accountsList() { return Object.values(this.paymentaccounts) }
    },
    methods: {
        itemsForAccount(accountid) {
            return this.paymentitems.filter(i => i.accountid === accountid)
        },

        edititem(item) {
            this.dialogData = item
            this.dialogApiType = 'update'
            this.itemDialog = true
            // console.log(JSON.stringify(item))
        },
        deleteitem(item) { console.log(JSON.stringify(item)) },
        editaccount(account) { console.log(JSON.stringify(account)) },
        deleteaccount(account) { console.log(JSON.stringify(account)) }
    }
}
</script>

<style>
.accountstable .v-icon, .itemstable .v-icon {
    margin-left: 10px;
}
</style>

<style scoped>
.itemstable {
    margin-top: 1rem;
    margin-bottom: 1rem;
    border: 1px solid #ccc;
    display: inline-block;
}
</style>
