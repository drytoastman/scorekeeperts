<template>
    <BaseDialog :value="value" apiType="insert" dataType="Paypal Account" width="400px" @input="$emit('input')" @update="update">
        <v-form ref="form">
            <v-container>
                <div class='text-center'><img :src="icons.paypalIcon" /></div>
                <v-text-field v-model="accountm.name"      label="Name"></v-text-field>
                <v-text-field v-model="accountm.accountid" label="Client Id"></v-text-field>
                <v-text-field v-model="accountm.secret"    label="Client Secret"></v-text-field>
            </v-container>
        </v-form>
    </BaseDialog>
</template>

<script>
import BaseDialog from '../../components/BaseDialog'
import paypalIcon from '../../images/paypal.svg'

export default {
    components: {
        BaseDialog
    },
    props: {
        value: Boolean
    },
    data() {
        return {
            accountm: {},
            icons: {
                paypalIcon
            }
        }
    },
    methods: {
        update() {
            this.$store.dispatch('setdata', {
                type: 'insert',
                items: {
                    paymentaccounts: [this.accountm],
                    paymentsecrets: [this.accountm]
                }
                // busy: { key: 'busyReg', id: this.event.eventid }
            })
            this.$emit('input')
        }
    },
    watch: {
        value: function(newv) {
            if (newv) {
                this.accountm = { type: 'paypal', attr:{} }
            }
        }
    }
}
</script>

<style scoped>
img {
    text-align: center;
}
</style>
