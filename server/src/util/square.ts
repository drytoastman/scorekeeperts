/* eslint-disable camelcase */
import { DBExtensions } from '../db'
import { ITask } from 'pg-promise'
import SquareConnect, { Money, ApiClient } from 'square-connect'
import { v1 as uuidv1 } from 'uuid'

import { Payment, UUID, PaymentAccount } from '@common/lib'

function getAClient(environment: string): ApiClient {
    const client = new SquareConnect.ApiClient()
    if (environment === 'sandbox') {
        client.basePath = 'https://connect.squareupsandbox.com'
    }
    return client
}

export async function squareOrder(task: ITask<DBExtensions> & DBExtensions, square: any, payments: Payment[], driverid: UUID): Promise<Payment[]> {

    const account = await task.payments.getPaymentAccount(square.accountid)
    const secret = await task.payments.getPaymentAccountSecret(square.accountid)

    const client = getAClient(account.attr.environment)
    client.authentications.oauth2.accessToken = secret

    const refid = uuidv1()
    const ikey2 = uuidv1()

    const body = {
        idempotency_key: refid,
        order: {
            location_id: account.accountid,
            reference_id: refid,
            line_items: [] as any
        }
    }

    for (const p of payments) {
        const event = await task.series.getEvent(p.eventid)
        body.order.line_items.push({
            name: event.name,
            variation_name: p.itemname,
            quantity: '1',
            base_price_money: {
                amount: p.amount,
                currency: 'USD'
            }
        })
    }

    const orders = new SquareConnect.OrdersApi(client)
    const orderresponse = await orders.createOrder(account.accountid, body)

    if (orderresponse.errors) {
        console.log('Order response errors: ' + orderresponse.errors)
        throw new Error(JSON.stringify(orderresponse.errors))
    }

    const sqpayment = {
        source_id: square.nonce,
        idempotency_key: ikey2,
        amount_money: orderresponse.order!.total_money as Money,
        order_id: orderresponse.order!.id
    }

    const paymentapi = new SquareConnect.PaymentsApi(client)
    const paymentresponse = await paymentapi.createPayment(sqpayment)

    if (paymentresponse.errors) {
        console.log('Payment response errors: ' + orderresponse.errors)
        throw new Error(JSON.stringify(orderresponse.errors))
    }

    payments.forEach(p => {
        p.refid  = ''
        p.txtype = 'square'
        p.txid   = paymentresponse.payment!.id as string
        p.txtime = paymentresponse.payment!.created_at as string
    })
    return task.payments.updatePayments('insert', payments, driverid)
}

const SQ_APPLICATION_ID = ''
const SQ_APPLICATION_SECRET = ''
export async function oauthRequest(account: PaymentAccount, authorizationCode: string) {

    const authzclient = getAClient(account.attr.environment)
    const tokenresponse = await new SquareConnect.OAuthApi(authzclient).obtainToken({
        client_id: SQ_APPLICATION_ID,
        client_secret: SQ_APPLICATION_SECRET,
        grant_type: 'authorization_code',
        code: authorizationCode
    })

    // save tokenresponse.access_token and tokenresponse.refresh_token

    const client = getAClient(account.attr.environment)
    client.authentications.oauth2.accessToken = tokenresponse.access_token!
    const locationResponse = await new SquareConnect.LocationsApi(client).listLocations()

    if (locationResponse.errors) {
        throw new Error('Error getting locations: ' + locationResponse.errors)
    }
    if (locationResponse.locations!.length === 0) {
        throw new Error('No locations present, need at least one')
    }

    // Send to page to select from
    // locationResponse.locations[n].id, locationResponse.locations[0].name
}

export async function oauthRefresh(account: PaymentAccount, refreshToken: string) {

    const authzclient = getAClient(account.attr.environment)

    // save tokenresponse.access_token
}
