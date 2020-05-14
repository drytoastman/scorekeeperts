/* eslint-disable @typescript-eslint/camelcase */
import Vue from 'vue'

declare const paypal: any

const INTG_DATE = '2020-05-12'

export async function loadPaypal(clientid: string, style: object, elid: string, buildOrder: Function, approved: Function) {
    await Vue.loadScript(`https://www.paypal.com/sdk/js?client-id=${clientid}&integration-date=${INTG_DATE}`)
    paypal.Buttons({
        style: style,
        createOrder: function(data, actions) { return actions.order.create(buildOrder()) },
        onApprove: approved
    }).render(elid)
}

export async function unloadPaypal(clientid: string) {
    await Vue.unloadScript(`https://www.paypal.com/sdk/js?client-id=${clientid}&integration-date=${INTG_DATE}`)
}

export function buildPaypalOrder(purchases) {
    let total = 0
    const items: any[] = []
    purchases.forEach(pur => {
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
}
