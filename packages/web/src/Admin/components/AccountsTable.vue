<template>
    <div class='accountstable'>
        <div class='doclink'>Documentation at <a href='/docs/paymentaccounts' target='_blank'>{{prefix}}/docs/paymentaccounts</a></div>

        <div class='baseadminbuttons' :style=buttongridtemplate>
            <v-btn color="secondary" :href="squareOAuthUrl" :disabled="!squareapplicationid">
                (Re)Authorize <img class='squareicon' :src="icons.squareIcon"/>
                <span v-if="squareapplicationid.includes('sandbox')" class='sandbox'>Sandbox</span>
            </v-btn>

            <v-btn color="secondary" @click.stop="newpaypal">
                Add <img class='paypalicon' :src="icons.paypalIcon"/>
            </v-btn>
        </div>

        <div class='tableborder'>
            <v-data-table :items="accountsList" :headers="headers" :expanded.sync="expanded"
                disable-pagination hide-default-footer item-key="name" class="accountstable">
                <template v-slot:[`item.actions`]="{ item }">
                    <v-icon small @click="editaccount(item)">{{icons.mdiPencil}}</v-icon>
                    <v-icon small @click="deleteaccount(item)">{{icons.mdiDelete}}</v-icon>
                </template>

                <template v-slot:[`item.type`]="{ item }">
                    <img v-if="item.type === 'square'" :src="icons.squareIcon" />
                    <img v-else :src="icons.paypalIcon" />
                    <v-icon v-if="item.attr.mode==='sandbox'" color=red>{{icons.mdiBug}}</v-icon>
                </template>

            </v-data-table>
        </div>

        <div class='memberinputs'>
            <v-select label="Membership Payment Account"  outlined item-value="accountid" item-text="name" ref="memselect"
                v-model="membershipaccount" :items="memberAccountList"></v-select>
        </div>

        <div class='adminbuttons1'>
            <v-btn color="secondary" @click.stop="newitem">
                Add Item
            </v-btn>
        </div>

        <div class='tableborder'>
            <ItemsTable accountid="" @edititem="edititem" @deleteitem="deleteitem"></ItemsTable>
        </div>

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
import ItemsTable from './ItemsTable.vue'
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
                { text: 'Actions', value: 'actions', sortable: false }
            ],
            prefix: window.location.protocol + '//' + window.location.host
        }
    },
    computed: {
        ...mapState(['currentSeries', 'settings', 'paymentaccounts', 'paymentitems', 'squareapplicationid']),
        accountsList() { return Object.values(this.paymentaccounts) },
        memberAccountList() { return [{ accountid: '', name: '' }, ...this.accountsList] },

        membershipaccount: {
            get() { return this.settings.membershipaccount },
            set(val) {
                if (this.settings.membershipaccount === val) return
                this.$store.dispatch('setdata', { items: { settings: Object.assign({}, this.settings, { membershipaccount: val }) }}).then(() => {
                    if (this.$refs.memselect)  {
                        this.$refs.memselect.setValue(this.settings.membershipaccount)
                    }
                })
            }
        },

        squareOAuthUrl() {
            let host = 'https://connect.squareup.com'
            if (this.squareapplicationid.includes('sandbox')) {
                host = 'https://connect.squareupsandbox.com'
            }
            const scope = 'MERCHANT_PROFILE_READ,PAYMENTS_WRITE,PAYMENTS_READ,ORDERS_WRITE'
            return `${host}/oauth2/authorize?client_id=${this.squareapplicationid}&scope=${scope}&state=${this.currentSeries}`
        },
        buttongridtemplate() {
            return `grid-template-columns: ${this.squareapplicationid.includes('sandbox') ? 20 : 15}rem 10rem`
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

</style>

<style scoped lang='scss'>
.tableborder {
    border: 1px solid #CCC;
    padding: 1rem;
    margin-top: 1rem;
}
.itemstable {
    margin: 1rem auto;
    display: table;
    width: 100%;
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
.accountstable ::v-deep {
    .accountstable .v-icon, .itemstable .v-icon {
        margin-left: 10px;
    }
    .itemstable .v-btn--fab .v-icon {
        margin-left: 0;
    }
    .v-data-table__mobile-row {
        justify-content: initial;
    }
    .v-data-table__mobile-row__header {
        width: 6rem;
    }
    .memberinputs {
        margin-top: 1rem;
        column-gap: 1rem;
    }
}
</style>
