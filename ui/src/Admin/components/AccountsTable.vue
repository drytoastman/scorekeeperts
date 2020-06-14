<template>
    <div class='accountstable'>
        <v-btn color="secondary" :href="squareOAuthUrl" :disabled="!squareapplicationid">
            (Re)Authorize <img class='squareicon' :src="icons.squareIcon"/>
            <span v-if="squareapplicationid.includes('sandbox')" class='sandbox'>Sandbox</span>
        </v-btn>

        <v-btn color="secondary" @click.stop="newpaypal">
            Add <img class='paypalicon' :src="icons.paypalIcon"/>
        </v-btn>

        <v-data-table :items="accountsList" :headers="headers" :expanded.sync="expanded"
            disable-pagination hide-default-footer show-expand item-key="name" class="accountstable">
            <template v-slot:item.actions="{ item }">
                <v-icon small @click="editaccount(item)">{{icons.mdiPencil}}</v-icon>
                <v-icon small @click="deleteaccount(item)">{{icons.mdiDelete}}</v-icon>
            </template>

            <template v-slot:item.type="{ item }">
                <img v-if="item.type === 'square'" :src="icons.squareIcon" />
                <img v-else :src="icons.paypalIcon" />
                <v-icon v-if="item.attr.mode==='sandbox'" color=red>{{icons.mdiBug}}</v-icon>
            </template>

            <template v-slot:expanded-item="{ headers, item }">
                <td :colspan="headers.length">
                    <ItemsTable :accountid="item.accountid" @edititem="edititem" @deleteitem="deleteitem" @newitem="newitem"></ItemsTable>
                </td>
            </template>
        </v-data-table>



        <ItemDialog    :item="dialogData"    :apiType="dialogApiType" v-model="itemDialog"></ItemDialog>
        <AccountDialog :account="dialogData" :apiType="dialogApiType" v-model="accountDialog"></AccountDialog>
        <AddPaypalDialog v-model="paypalDialog"></AddPaypalDialog>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import { v1 as uuidv1 } from 'uuid'
import { mdiPencil, mdiDelete, mdiBug } from '@mdi/js'
import squareIcon from '../../images/square.svg'
import paypalIcon from '../../images/paypal.svg'
import ItemsTable from './ItemsTable'
import ItemDialog from './ItemDialog'
import AccountDialog from './AccountDialog'
import AddPaypalDialog from './AddPaypalDialog'

export default {
    name: 'Accounts',
    components: {
        ItemsTable,
        ItemDialog,
        AccountDialog,
        AddPaypalDialog
    },
    data() {
        return {
            expanded: [],
            dialogData: {},
            dialogApiType: '',
            itemDialog: false,
            accountDialog: false,
            paypalDialog: false,
            icons: {
                mdiPencil,
                mdiDelete,
                mdiBug,
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
        ...mapState(['currentSeries', 'paymentaccounts', 'squareapplicationid']),
        accountsList() { return Object.values(this.paymentaccounts) },
        devMode() { return process.env.NODE_ENV === 'development' },
        squareOAuthUrl() {
            let host = 'https://connect.squareup.com'
            if (this.squareapplicationid.includes('sandbox')) {
                host = 'https://connect.squareupsandbox.com'
            }
            const scope = 'MERCHANT_PROFILE_READ,PAYMENTS_WRITE,PAYMENTS_READ,ORDERS_WRITE'
            return `${host}/oauth2/authorize?client_id=${this.squareapplicationid}&scope=${scope}&state=${this.currentSeries}`
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
        newpaypal() {
            this.paypalDialog = true
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
img {
    margin-left: 10px;
    vertical-align: middle;
}
.paypalicon {
    padding: 4px;
    height: 30px;
    filter: brightness(170%);
}
.squareicon {
    height: 20px;
    filter: brightness(0) invert(100);
}
.sandbox {
    margin-left: 10px;
    color: orange;
}
.accountstable > .v-btn {
    margin-left: 1rem;
    margin-top: 1rem;
}
</style>
