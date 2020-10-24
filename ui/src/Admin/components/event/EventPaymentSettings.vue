<template>
    <div class='outer'>
        <div class='adminbuttons'>
            <v-btn color="secondary" :disabled="unchanged" @click="reset">Reset</v-btn>
            <v-btn color="secondary" :disabled="unchanged" @click="savePayments">Save</v-btn>
        </div>

        <div class='payments'>
            <div class='accountbox'>
                <v-select   v-model="eventdata.accountid" style="grid-area: acct"  label="Payment Account" :items="acctlist"
                            item-value="accountid" item-text="name" class="accountselect" hide-details solo></v-select>
                <v-checkbox v-model="eventdata.required" style="grid-area: preq" label="Payment Required"></v-checkbox>
            </div>

            <v-data-table :items="eventdata.items" :headers="headers" item-key="item.itemid" class='itemstable'
                  disable-pagination hide-default-footer dense>

                <template v-slot:[`item.checked`]="{ item }">
                    <v-checkbox v-model="item.checked" @click="change"></v-checkbox>
                </template>
                <template v-slot:[`item.map.required`]="{ item }">
                    <v-checkbox v-if="item.item.itemtype===generaltype" v-model="item.map.required" @click="change"></v-checkbox>
                </template>
                <template v-slot:[`item.map.maxcount`]="{ item }">
                    <v-select v-if="item.item.itemtype===generaltype" v-model="item.map.maxcount" :items="[0,1,2,3,4]" @change="change"
                                hide-details solo class="maxselect" ></v-select>
                </template>


                <template v-slot:[`item.item.price`]="{ item }">
                    {{item.item.price|cents2dollars}}
                </template>
                <template v-slot:[`item.item.itemtype`]="{ item }">
                    {{itemtypes[item.item.itemtype].text}}
                </template>
            </v-data-table>
        </div>
    </div>
</template>

<script>
import cloneDeep from 'lodash/cloneDeep'
import isEqual from 'lodash/isEqual'
import orderBy from 'lodash/orderBy'
import { mapState } from 'vuex'
import { ITEMTYPES, ITEM_TYPE_GENERAL_FEE, ITEM_TYPE_SERIES_FEE } from '@/common/payments'

export default {
    name: 'EventPaymentSettingsForm',
    props: {
        seriesevent: Object
    },
    data() {
        return {
            itemtypes: ITEMTYPES,
            generaltype: ITEM_TYPE_GENERAL_FEE,
            headers: [
                { text: 'Use',       value: 'checked' },
                // { text: 'Automatic', value: 'map.required' },
                { text: 'Max Count', value: 'map.maxcount' },
                { text: 'Name',      value: 'item.name' },
                { text: 'Price',     value: 'item.price' },
                { text: 'Type',      value: 'item.itemtype' }
            ],
            eventdata: {},
            saveeventdata: {}
        }
    },
    computed: {
        ...mapState(['paymentaccounts', 'paymentitems']),
        acctlist()  { return [{ accountid: null, name: '' }, ...Object.values(this.paymentaccounts)] },
        unchanged() { return isEqual(this.saveeventdata, this.eventdata) }
    },
    methods: {
        change() {
            this.changecounter++
        },
        savePayments() {
            const emod = cloneDeep(this.seriesevent)
            emod.accountid       = this.eventdata.accountid
            emod.attr.paymentreq = this.eventdata.required
            emod.items           = this.eventdata.items.filter(m => m.checked).map(m => m.map)

            this.$store.dispatch('setdata', {
                type: 'update',
                items: { events: [emod] }
            })
        },
        reset() {
            const ret = {
                accountid: this.seriesevent.accountid,
                required: this.seriesevent.attr.paymentreq,
                items: []
            }

            const items = {}
            for (const item of Object.values(this.paymentitems)) {
                if (item.itemtype === ITEM_TYPE_SERIES_FEE) continue

                items[item.itemid] = {
                    checked: false,
                    item: item,
                    map: {
                        eventid: this.seriesevent.eventid,
                        itemid: item.itemid,
                        required: false,
                        maxcount: 0
                    }
                }
            }

            for (const map of this.seriesevent.items) {
                items[map.itemid].checked = true
                items[map.itemid].map = map
            }

            ret.items = orderBy(Object.values(items), ['itemtype', 'name'])
            this.saveeventdata = ret
            this.eventdata = cloneDeep(this.saveeventdata)
        }
    },
    watch: {
        seriesevent() { this.reset() },
        paymentitems() { this.reset() }
    },
    mounted() { this.reset() }
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
</style>
