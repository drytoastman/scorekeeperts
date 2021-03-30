<template>
    <BaseDialog :value="value" apiType="insert" dataType="Account" width="400px" @input="$emit('input')" @update="update">
        <v-form ref="form">
            <v-container>
                <div class='text-center'><img :src="icons.paypalIcon" /></div>
                <v-text-field v-model="account.name"      label="Name"></v-text-field>
                <v-text-field v-model="account.accountid" label="App Client Id (not paypal username)"></v-text-field>
                <v-text-field v-model="secret.secret"     label="App Client Secret (not paypal password)"></v-text-field>
                <v-select :items="['production', 'sandbox']" v-model="account.attr.mode" label='mode' light hide-details placeholder="Select A Mode"></v-select>
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
            account: { attr: {}},
            secret: { attr: {}},
            icons: { paypalIcon }
        }
    },
    methods: {
        update() {
            this.secret.accountid = this.account.accountid
            this.$store.dispatch('setdata', {
                type: 'insert',
                items: {
                    paymentaccounts: [this.account],
                    paymentsecrets: [this.secret]
                }
            })
            this.$emit('input')
        }
    },
    watch: {
        value: function(newv) {
            if (newv) {
                this.account = { type: 'paypal', attr: { mode: 'production', version: 2 }}
                this.secret  = { attr: {}}
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
