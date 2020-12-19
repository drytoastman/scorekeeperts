<template>
    <BaseDialog :value="value" :apiType="apiType" dataType="Item" width="430px" @input="$emit('input')" @update="update">
        <v-form ref="form">
            <v-container>
                <v-text-field v-model="itemm.name"     label="Name"></v-text-field>
                <v-text-field v-model="priceInDollars" label="Price" prefix="$" :rules="dollar"></v-text-field>
                <v-select     v-model="itemm.itemtype" label="Item Type" :items="itemtypes"></v-select>

                <div class='attrgrid'>
                    <span class='key'>currency:</span> <span class='val'>{{itemm.currency}}</span>
                    <span class='key'>itemid:</span>   <span class='val'>{{itemm.itemid}}</span>
                </div>
            </v-container>
        </v-form>
    </BaseDialog>
</template>

<script>
import { isDollar } from 'sctypes/util'
import BaseDialog from '../../components/BaseDialog'
import { ITEMTYPES } from 'sctypes/payments'

export default {
    components: {
        BaseDialog
    },
    props: {
        value: Boolean,
        item: Object,
        apiType: String
    },
    data() {
        return {
            itemm: { }, // we get a copy when the dialog arg changes, data initializer won't catch that
            priceInDollars: 0,
            dollar: [isDollar],
            itemtypes: ITEMTYPES
        }
    },
    methods: {
        update() {
            // back to cents
            this.itemm.price = this.priceInDollars * 100
            this.$store.dispatch('setdata', {
                type: this.apiType,
                items: { paymentitems: [this.itemm] }
                // busy: { key: 'busyReg', id: this.event.eventid }
            })
            this.$emit('input')
        }
    },
    watch: {
        value: function(newv) {
            if (newv) {
                this.itemm = JSON.parse(JSON.stringify(this.item))
                this.itemm.accountid = ''
                this.priceInDollars = ''
                if (this.itemm.price) {
                    this.priceInDollars = this.itemm.price / 100
                }
            }
        }
    }
}
</script>

<style scoped>
.attrgrid {
    display: grid;
    grid-template-columns: auto auto;
    column-gap: 5px;
    row-gap: 2px;
}
.key {
    text-align: right;
}
.val {
    overflow: auto;
}
</style>
