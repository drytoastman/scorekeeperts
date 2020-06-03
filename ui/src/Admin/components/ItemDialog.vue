<template>
    <v-dialog :value="value" @input="$emit('input')" persistent max-width="400px">
        <v-card>
            <v-card-title>
                <span class="headline">{{title}}</span>
            </v-card-title>
            <v-card-text :class='{disabledform: disableAll}'>
                <v-form ref="form">
                    <v-container>
                        <v-text-field v-model="itemm.name"   label="Name"></v-text-field>
                        <v-text-field v-model="itemm.price"  label="Price" prefix="$" :rules="dollar"></v-text-field>
                        <v-text-field v-model="itemm.currency" label="Currency" readonly></v-text-field>
                    </v-container>
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="$emit('input')">Cancel</v-btn>
                <v-btn color="blue darken-1" text @click="update()">{{actionName}}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import { isDollar } from '@common/lib/util'

export default {
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
    computed: {
        title() {
            switch (this.apiType) {
                case 'insert': return 'New Item'
                case 'update': return 'Update Item'
                case 'delete': return 'Delete Item'
                default: return '???'
            }
        },
        actionName() {
            switch (this.apiType) {
                case 'insert': return 'Create'
                case 'update': return 'Update'
                case 'delete': return 'Delete'
                default: return '???'
            }
        },
        disableAll: function() { return this.actionName === 'Delete' }
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
.disabledform {
   background: #c8c8c8;
   pointer-events: none;
   opacity: 0.5;
}
</style>
