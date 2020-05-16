<template>
    <div id="paypal-button-container" :class="total > 0 ? '' : 'disabled'">
    </div>
</template>

<script>
import Vue from 'vue'

export default {
    props: {
        total: Number,
        opened: Boolean,
        account: Object,
        purchase: Array
    },
    data() {
        return {
            INTG_DATE: '2020-05-12'
        }
    },
    computed: {
        paypalURL() {
            return `https://www.paypal.com/sdk/js?client-id=${this.account.accountid}&integration-date=${this.INTG_DATE}&disable-funding=credit`
        }
    },
    methods: {
        createPayments() {
            return this.purchase.map(o => ({
                eventid: o.event.eventid,
                carid: o.car.carid,
                session: o.session,
                itemname: o.item.name,
                amount: o.item.price
            })).value()
        },

        buildPaypalOrder() {
            /* eslint-disable @typescript-eslint/camelcase */
            let total = 0
            const items = []
            this.purchase.forEach(pur => {
                items.push({ name: `${pur.event.name} - ${pur.item.name}`, quantity: '1', unit_amount: { currency_code: 'USD', value: (pur.item.price / 100).toFixed(2) } })
                total += pur.item.price
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
            /* eslint-enable */
        },

        paypalApproved(data) {
            this.$store.dispatch('setdata', {
                series: this.series,
                type: 'insert',
                paypal: { orderid: data.orderID, accountid: this.account.accountid },
                payments: this.createPayments(),
                busy: { key: 'busyPay', ids: this.accountEvents.map(e => e.eventid) }
            })
            this.$emit('input')
        },

        async loadPaypal() {
            await Vue.loadScript(this.paypalURL)
            const func = this.buildPaypalOrder

            // eslint-disable-next-line no-undef
            paypal.Buttons({
                style: {
                    layout: 'horizontal',
                    tagline: false,
                    height: 35
                },
                createOrder: function(data, actions) { return actions.order.create(func()) },
                onApprove: this.paypalApproved
            }).render('#paypal-button-container')
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
