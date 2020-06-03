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
                    <ItemsTable :accountid="item.accountid" @edititem="edititem" @deleteitem="deleteitem" @newitem="newitem"></ItemsTable>
                </td>
            </template>
        </v-data-table>

        <ItemDialog    :item="dialogData"    :apiType="dialogApiType" v-model="itemDialog"></ItemDialog>
        <AccountDialog :account="dialogData" :apiType="dialogApiType" v-model="accountDialog"></AccountDialog>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import { v1 as uuidv1 } from 'uuid'
import { mdiPencil, mdiDelete } from '@mdi/js'
import squareIcon from '../../images/square.svg'
import paypalIcon from '../../images/paypal.svg'
import ItemsTable from './ItemsTable'
import ItemDialog from './ItemDialog'
import AccountDialog from './AccountDialog'

export default {
    name: 'Accounts',
    components: {
        ItemsTable,
        ItemDialog,
        AccountDialog
    },
    data() {
        return {
            expanded: [],
            dialogData: {},
            dialogApiType: '',
            itemDialog: false,
            accountDialog: false,
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
        ...mapState(['paymentaccounts']),
        accountsList() {
            console.log('new list')
            return Object.values(this.paymentaccounts)
            }
    },
    methods: {
        newitem(accountid) {
            this.dialogData = { accountid: accountid, itemid: uuidv1(), currency: 'USD' }
            this.dialogApiType = 'insert'
            this.itemDialog = true
        },
        edititem(item) {
            this.dialogData = item
            this.dialogApiType = 'update'
            this.itemDialog = true
        },
        deleteitem(item) {
            this.dialogData = item
            this.dialogApiType = 'delete'
            this.itemDialog = true
        },
        editaccount(account) {
            this.dialogData = account
            this.dialogApiType = 'update'
            this.accountDialog = true
        },
        deleteaccount(account) {
            this.dialogData = account
            this.dialogApiType = 'delete'
            this.accountDialog = true
        }
    }
}
</script>

<style>
.accountstable .v-icon, .itemstable .v-icon {
    margin-left: 10px;
}
.itemstable .v-btn--fab .v-icon {
    margin-left: 0;
}
.v-data-table__mobile-row__cell {
    padding-left: 10px;
}
</style>

<style scoped>
.itemstable {
    margin: 1rem auto;
    display: table;
}
</style>
