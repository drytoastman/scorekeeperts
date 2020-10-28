<template>
    <!-- eslint-disable vue/no-mutating-props -->
    <div class='payments'>
        <div class='accountbox'>
            <v-select   v-model="eventm.accountid" style="grid-area: acct"  label="Payment Account" :items="acctlist"
                        item-value="accountid" item-text="name" class="accountselect" no-data-text="No V2 accounts to use" hide-details>
            </v-select>
            <v-checkbox v-model="eventm.attr.paymentreq" style="grid-area: preq" label="Payment Required"></v-checkbox>
        </div>

        <v-data-table :items="eventm.items" :headers="headers" item-key="item.itemid" class='itemstable'
                disable-pagination hide-default-footer dense>

            <template v-slot:[`item.checked`]="{ item }">
                <v-checkbox v-model="item.checked"></v-checkbox>
            </template>
            <template v-slot:[`item.map.required`]="{ item }">
                <v-checkbox v-if="item.item.itemtype===generaltype" v-model="item.map.required"></v-checkbox>
            </template>
            <template v-slot:[`item.map.maxcount`]="{ item }">
                <v-select v-if="item.item.itemtype===generaltype" v-model="item.map.maxcount" :items="[0,1,2,3,4]" hide-details solo class="maxselect" ></v-select>
            </template>


            <template v-slot:[`item.item.price`]="{ item }">
                {{item.item.price|cents2dollars}}
            </template>
            <template v-slot:[`item.item.itemtype`]="{ item }">
                {{itemtypes[item.item.itemtype].text}}
            </template>
        </v-data-table>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import { ITEMTYPES, ITEM_TYPE_GENERAL_FEE } from '@/common/payments'

export default {
    name: 'Payments',
    props: {
        eventm: Object
    },
    data() {
        return {
            itemtypes: ITEMTYPES,
            generaltype: ITEM_TYPE_GENERAL_FEE,
            headers: [
                { text: 'Use',       value: 'checked' },
                { text: 'Max Count', value: 'map.maxcount' },
                { text: 'Name',      value: 'item.name' },
                { text: 'Price',     value: 'item.price' },
                { text: 'Type',      value: 'item.itemtype' }
            ]
        }
    },
    computed: {
        ...mapState(['paymentaccounts']),
        acctlist()  {
            const accts = Object.values(this.paymentaccounts).filter(a => a.attr.version >= 2)
            if (accts.length === 0) return []
            return [{ accountid: null, name: '' }, ...accts]
        }
    }
}
</script>

<style scoped>
.accountbox {
    display: flex;
    column-gap: 1rem;
    margin-top: 1rem;
}
.maxselect {
    max-width: 5rem;
}
.accountselect {
    max-width: 15rem;
}
.itemstable {
    max-width: initial;
    display: flex;
}
.nonitem {
    color: #888C;
}
</style>
