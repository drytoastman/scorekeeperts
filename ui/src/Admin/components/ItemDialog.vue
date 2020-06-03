<template>
    <BaseDialog :value="value" :apiType="apiType" dataType="Item" width="430px" @input="$emit('input')" @update="update">
        <v-form ref="form">
            <v-container>
                <v-text-field v-model="itemm.name"   label="Name"></v-text-field>
                <v-text-field v-model="itemm.price"  label="Price" prefix="$" :rules="dollar"></v-text-field>
                <div class='attrgrid'>
                    <span class='key'>currency:</span><span>{{itemm.currency}}</span>
                    <span class='key'>accountid:</span><span>{{itemm.accountid}}</span>
                    <span class='key'>itemid:</span><span>{{itemm.itemid}}</span>
                </div>
            </v-container>
        </v-form>
    </BaseDialog>
</template>

<script>
import { isDollar } from '@common/lib/util'
import BaseDialog from '../../components/BaseDialog'

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
            dollar: [isDollar]
        }
    },
    methods: {
        update() {
            // back to cents
            this.itemm.price *= 100
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
                // convert from cents to dollars
                if (this.itemm.price) {
                    this.itemm.price /= 100
                } else {
                    this.item.price = ''
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
</style>
