import axios from 'axios'
import { base64encode } from 'nodejs-base64'
import { ScorekeeperProtocol } from '../db'
import { Payment, UUID } from '@common/lib'

function oauthUrl(mode: string) {
    const infix = (mode === 'sandbox') ? 'sandbox.' : ''
    return `https://api.${infix}paypal.com/v1/oauth2/token/`
}

function captureUrl(mode: string, orderid: string) {
    const infix = (mode === 'sandbox') ? 'sandbox.' : ''
    return `https://api.${infix}paypal.com/v2/checkout/orders/${orderid}/capture`
}

export async function paypalCapture(conn: ScorekeeperProtocol, paypal: any, payments: Payment[], driverid: UUID): Promise<Payment[]> {

    const secret    = await conn.payments.getPaymentAccountSecret(paypal.accountid)
    const account   = await conn.payments.getPaymentAccount(paypal.accountid)
    const basicAuth = base64encode(`${paypal.accountid}:${secret.secret}`)
    const auth      = await axios.post(oauthUrl(account.attr.mode), 'grant_type=client_credentials', {
        headers: {
            Authorization: `Basic ${basicAuth}`
        }
    })

    const capture = await axios.post(captureUrl(account.attr.mode, paypal.orderid), '', {
        headers: {
            Authorization: `Bearer ${auth.data.access_token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json'
        }
    })

    const data = capture.data
    if (!data.error) {
        const capture = data.purchase_units[0].payments.captures[0]
        payments.forEach(p => {
            p.refid  = ''
            p.txtype = 'paypal'
            p.txid   = capture.id
            p.txtime = capture.create_time
        })
        return conn.payments.updatePayments('insert', payments, driverid)
    }

    throw new Error(data.error)
}
