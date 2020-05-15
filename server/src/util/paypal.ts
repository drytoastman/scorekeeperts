import axios from 'axios'
import { base64encode } from 'nodejs-base64'
import { DBExtensions } from '../db'
import { ITask } from 'pg-promise'
import { Payment, UUID } from '@common/lib'

function oauthUrl(environment: string) {
    const infix = (environment === 'sandbox') ? 'sandbox.' : ''
    return `https://api.${infix}paypal.com/v1/oauth2/token/`
}

function captureUrl(environment: string, orderid: string) {
    const infix = (environment === 'sandbox') ? 'sandbox.' : ''
    return `https://api.${infix}paypal.com/v2/checkout/orders/${orderid}/capture`
}

export async function paypalCapture(task: ITask<DBExtensions> & DBExtensions, paypal: any, payments: Payment[], driverid: UUID): Promise<Payment[]> {

    const secret = await task.payments.getPaymentAccountSecret(paypal.accountid)
    const account = await task.payments.getPaymentAccount(paypal.accountid)
    const basicAuth = base64encode(`${paypal.accountid}:${secret}`)
    const auth = await axios.post(oauthUrl(account.attr.environment), 'grant_type=client_credentials', {
        headers: {
            Authorization: `Basic ${basicAuth}`
        }
    })

    const capture = await axios.post(captureUrl(account.attr.environment, paypal.orderid), '', {
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
        return task.payments.updatePayments('insert', payments, driverid)
    }

    throw new Error(data.error)
}
