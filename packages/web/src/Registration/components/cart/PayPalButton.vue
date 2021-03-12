<template>
    <div id="paypal-button-container" :class="total > 0 ? '' : 'disabled'">
    </div>
</template>

<script>
import Vue from 'vue'
import { mapState } from 'vuex'
const INTG_DATE = '2020-05-12'

export default {
    props: {
        opened: Boolean,
        account: Object,
        purchase: Array,
        payments: Array,
        total: Number
    },
    computed: {
        ...mapState(['events', 'cars', 'paymentitems']),
        paypalURL() {
            return `https://www.paypal.com/sdk/js?client-id=${this.account.accountid}&integration-date=${INTG_DATE}&disable-funding=credit`
        }
    },
    methods: {
        buildPaypalOrder() {
            let total = 0
            const items = []
            this.purchase.forEach(pur => {
                const event = this.events[pur.eventid]
                const item  = this.paymentitems[pur.itemid]
                const name  = event ? `${event.name} - ${item.name}` : `Membership - ${item.name}`
                items.push({ name: name, quantity: '1', unit_amount: { currency_code: 'USD', value: (item.price / 100).toFixed(2) }})
                total += item.price
            })

            const fixedtotal = (total / 100).toFixed(2)
            return {
                purchase_units: [{
                    amount: {
                        value: fixedtotal,
                        currency_code: 'USD',
                        breakdown: {
                            item_total: {
                                currency_code: 'USD',
                                value: fixedtotal
                            }
                        }
                    },
                    items: items
                }]
            }
        },

        paypalApproved(data) {
            this.$store.dispatch('setdata', {
                type: 'insert',
                paypal: { orderid: data.orderID, accountid: this.account.accountid },
                items: { payments: this.payments },
                busy: { key: 'busyPay', ids: this.payments.map(p => p.eventid) }
            })
            this.$emit('complete')
        },

        async loadPaypal() {
            try {
                await Vue.loadScript(this.paypalURL)
                const func = this.buildPaypalOrder

                paypal.Buttons({
                    style: {
                        layout: 'horizontal',
                        tagline: false,
                        height: 35
                    },
                    createOrder: function(data, actions) { return actions.order.create(func()) },
                    onApprove: this.paypalApproved
                }).render('#paypal-button-container')
            } catch (error) {
                this.$store.commit('addErrors', [`Failed to load ${this.paypalURL}, check any privacy extensions: ${error}`])
                console.log('paypal load failure:')
                console.log(error)
            }
        },

        async unloadPaypal() {
            await Vue.unloadScript(this.paypalURL)
        }
    },
    watch: {
        opened: async function(newv) {
            if (newv) {
                this.loadPaypal()
            } else {
                this.unloadPaypal()
            }
        }
    },
    mounted() {
        this.loadPaypal()
    }
}
</script>

<style>
#paypal-button-container {
    width: 100%;
    padding-top: 0.2rem;
}
#paypal-button-container.disabled {
    pointer-events: none;
    opacity: 0.4;
}
</style>
