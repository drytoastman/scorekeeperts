import axios from 'axios'
import { v1 as uuidv1 } from 'uuid'
import { ScorekeeperProtocol } from 'scdb'
import { paymentslog } from './logging'
import { PaymentAccount, PaymentAccountSecret } from 'sctypes/payments'
import { Payment } from 'sctypes/register'
import { UUID } from 'sctypes/util'

function oauthUrl(mode: string) {
    const infix = (mode === 'sandbox') ? 'sandbox.' : ''
    return `https://api.${infix}paypal.com/v1/oauth2/token/`
}

function captureUrl(mode: string, orderid: string) {
    const infix = (mode === 'sandbox') ? 'sandbox.' : ''
    return `https://api.${infix}paypal.com/v2/checkout/orders/${orderid}/capture`
}

/*
function paymentsUrl(mode: string, txid: string) {
    const infix = (mode === 'sandbox') ? 'sandbox.' : ''
    return `https://api.${infix}paypal.com/v2/payments/captures/${txid}`
}
*/

async function paypalToken(account: PaymentAccount, secret: PaymentAccountSecret) {
    const basicAuth = Buffer.from(`${account.accountid}:${secret.secret}`, 'utf8').toString('base64')
    const auth = await axios.post<any>(oauthUrl(account.attr.mode), 'grant_type=client_credentials', {
        headers: {
            Authorization: `Basic ${basicAuth}`
        }
    })
    return auth.data.access_token
}

export async function paypalCapture(conn: ScorekeeperProtocol, paypal: any, payments: Payment[], driverid: UUID): Promise<Payment[]> {

    let capture, account, token
    try {
        const secret = await conn.payments.getPaymentAccountSecret(paypal.accountid)
        account = await conn.payments.getPaymentAccount(paypal.accountid)
        token   = await paypalToken(account, secret)

        capture = await axios.post<any>(captureUrl(account.attr.mode, paypal.orderid), undefined, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                'Content-Type': 'application/json'
            }
        })
    } catch (error: any) {
        if ((error.response) && (error.response.data)) {
            paymentslog.error(`Paypal error: ${JSON.stringify(error.response.data.details)}`)
            throw new Error(`Paypal error: ${error.response.data.message}`)
        }
        throw error
    }

    const data = capture.data
    if (!data.error) {
        const capture = data.purchase_units[0].payments.captures[0]
        payments.forEach(p => {
            p.payid  = uuidv1()
            p.txtype = 'paypal'
            p.txid   = capture.id
            p.txtime = capture.create_time
            p.accountid = account.accountid
            p.refunded = false
        })
        return conn.payments.updatePayments('insert', payments, driverid)
    }

    throw new Error(data.error)
}

/*
export async function paypalCheckRefunds(conn: ScorekeeperProtocol, account: PaymentAccount) {

    const secret    = await conn.payments.getPaymentAccountSecret(account.accountid)
    const payments  = await conn.payments.getPaymentsbyAccountId(account.accountid)
    const token     = await paypalToken(account, secret)

    const todelete:Payment[] = []
    for (const payment of payments) {
        const capture = await axios.get<any>(paymentsUrl(account.attr.mode, payment.txid), {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                'Content-Type': 'application/json'
            }
        })

        const status = capture.data.status
        if (status === 'REFUNDED') {
            todelete.push(payment)
        }
    }

    paymentslog.info('delete ' + JSON.stringify(todelete))
    await conn.payments.updatePayments('delete', todelete)
}
*/
