<template>
    <v-dialog :value="value" @input="$emit('input')" persistent max-width="400px">
        <v-card>
            <v-card-title>
                <span class="headline">Edit Item</span>
            </v-card-title>
            <v-card-text>
                <v-form ref="form">
                    <v-container class='xformgrid'>
                        <v-text-field v-model="itemm.name"   label="Name"></v-text-field>
                        <v-text-field v-model="itemm.price"  label="Price" prefix="$" :rules="dollar"></v-text-field>
                    </v-container>
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="$emit('input')">Cancel</v-btn>
                <v-btn color="blue darken-1" text @click="update()">Update</v-btn>
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
                this.itemm.price /= 100
            }
        }
    }
}
</script>

<style scoped>
.formgrid {
    display: grid;
    grid-template-columns: 1fr 7fr;
    column-gap: 0.3rem;
    align-items: center;
}
</style>
