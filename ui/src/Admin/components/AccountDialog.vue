<template>
    <BaseDialog :value="value" :apiType="apiType" dataType="Account" width="400px" @input="$emit('input')" @update="update">
        <v-form ref="form">
            <v-container>
                <v-text-field v-model="accountm.name" label="Name"></v-text-field>
                <div class='attrgrid'>
                    <span style="grid-column: 1 / span 2; justify-self: center">
                        <img v-if="accountm.type === 'square'" :src="icons.squareIcon" />
                        <img v-else :src="icons.paypalIcon" />
                    </span>
                    <span class='key'>accountid:</span>
                    <span class='val'>{{accountm.accountid}}</span>
                    <template v-for="key in accountattr">
                        <span class='key' :key="key">{{key}}:</span>
                        <span class='val' :key="key+'x'">{{accountm.attr[key]}}</span>
                    </template>
                </div>
            </v-container>
        </v-form>
    </BaseDialog>
</template>

<script>
import BaseDialog from '../../components/BaseDialog'
import squareIcon from '../../images/square.svg'
import paypalIcon from '../../images/paypal.svg'

export default {
    components: {
        BaseDialog
    },
    props: {
        value: Boolean,
        account: Object,
        apiType: String
    },
    data() {
        return {
            accountm: { }, // we get a copy when the dialog arg changes, data initializer won't catch that
            icons: {
                squareIcon,
                paypalIcon
            }
        }
    },
    computed: {
        accountattr() { return (this.accountm && this.accountm.attr) ? Object.keys(this.accountm.attr).sort() : [] }
    },
    methods: {
        update() {
            this.$store.dispatch('setdata', {
                type: this.apiType,
                items: { paymentaccounts: [this.accountm] }
                // busy: { key: 'busyReg', id: this.event.eventid }
            })
            this.$emit('input')
        }
    },
    watch: {
        value: function(newv) {
            if (newv) {
                this.accountm = JSON.parse(JSON.stringify(this.account))
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
