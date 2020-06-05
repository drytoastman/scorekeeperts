/* eslint-disable camelcase */
import { ScorekeeperProtocol } from '../db'
import SquareConnect, { Money, ApiClient, OrderRoundingAdjustment } from 'square-connect'
import { v1 as uuidv1 } from 'uuid'

import { Payment, UUID, PaymentAccount } from '@common/lib'
import { gCache } from './cache'

function getAClient(mode: string, token?: string): ApiClient {
    const client = new SquareConnect.ApiClient()
    if (mode === 'sandbox') {
        client.basePath = 'https://connect.squareupsandbox.com'
    }
    if (token) {
        client.authentications.oauth2.accessToken = token
    }
    return client
}

export async function squareOrder(conn: ScorekeeperProtocol, square: any, payments: Payment[], driverid: UUID): Promise<Payment[]> {

    const account = await conn.payments.getPaymentAccount(square.accountid)
    const secret  = await conn.payments.getPaymentAccountSecret(square.accountid)
    const client  = getAClient(account.attr.mode, secret.secret)
    const refid   = uuidv1()
    const ikey2   = uuidv1()

    const body = {
        idempotency_key: refid,
        order: {
            location_id: account.accountid,
            reference_id: refid,
            line_items: [] as any
        }
    }

    for (const p of payments) {
        const event = await conn.series.getEvent(p.eventid)
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

    return conn.payments.updatePayments('insert', payments, driverid)
}

export async function squareoAuthURL(conn: ScorekeeperProtocol, series: string) {
    let SQ_APPLICATION_ID = 'missing'
    try {
        SQ_APPLICATION_ID = await conn.payments.getSquareApplicationId()
    } catch (error) {
        console.log(error)
        // NO APPLICATION ID on onsite installs
        return ''
    }

    const CREATE_MODE = await conn.payments.getPaymentAccountCreateMode()
    const SCOPE       = 'MERCHANT_PROFILE_READ,PAYMENTS_WRITE,PAYMENTS_READ,ORDERS_WRITE'
    const client      = getAClient(CREATE_MODE)
    return `${client.basePath}/oauth2/authorize?client_id=${SQ_APPLICATION_ID}&scope=${SCOPE}&state=${series}`
}

export async function squareoAuthRequest(conn: ScorekeeperProtocol, series: string, authorizationCode: string) {
    const SQ_APPLICATION_ID     = await conn.payments.getSquareApplicationId()
    const SQ_APPLICATION_SECRET = await conn.payments.getSquareApplicationSecret()
    const CREATE_MODE           = await conn.payments.getPaymentAccountCreateMode()
    const authzclient           = getAClient(CREATE_MODE)

    const tokenresponse = await new SquareConnect.OAuthApi(authzclient).obtainToken({
        client_id: SQ_APPLICATION_ID,
        client_secret: SQ_APPLICATION_SECRET,
        grant_type: 'authorization_code',
        code: authorizationCode
    }).catch(error => {
        let msg
        try {
            msg = error.response.body.message
        } catch (referror) {
            msg = 'unknown error response from Square server'
        }
        throw msg
    })

    if ((!tokenresponse.access_token) || (!tokenresponse.refresh_token)) {
        throw new Error('token response is missing access or refresh token ' + tokenresponse)
    }

    const client = getAClient(CREATE_MODE, tokenresponse.access_token)
    const locationResponse = await new SquareConnect.LocationsApi(client).listLocations()

    if (locationResponse.errors) {
        throw new Error('Error getting locations: ' + locationResponse.errors)
    }
    if (locationResponse.locations!.length === 0) {
        throw new Error('No locations present, need at least one')
    }

    const requestid = uuidv1()
    const request = {
        secret: tokenresponse.access_token,
        expires: tokenresponse.expires_at,
        refresh: tokenresponse.refresh_token,
        locations: JSON.parse(JSON.stringify(locationResponse.locations)),
        series: series
    }
    gCache.set(requestid, request)

    return { requestid: requestid, locations: request.locations }
}


export async function squareoAuthFinish(conn: ScorekeeperProtocol, requestid: string, locationid: string) {
    const SQ_APPLICATION_ID = await conn.payments.getSquareApplicationId()
    const CREATE_MODE       = await conn.payments.getPaymentAccountCreateMode()

    const request = gCache.get(requestid) as any
    if (!request) {
        throw new Error('no request in cache, most likely expired (50 minutes)')
    }

    const location = request.locations.filter(l => l.id === locationid)
    if (location.length === 0) {
        throw new Error('That location id was not part of the list')
    }

    const account = {
        accountid: location[0].id,
        name: location[0].name,
        type: 'square',
        attr: {
            mode: CREATE_MODE,
            applicationid: SQ_APPLICATION_ID,
            merchantid: location[0].merchant_id
        },
        modified: ''
    }

    const secret = {
        accountid: locationid,
        secret: request.secret,
        attr: {
            refresh: request.refresh,
            expires: request.expires
        },
        modified: ''
    }

    await conn.series.setSeries(request.series)
    await conn.payments.upsertPaymentAccount(account)
    await conn.payments.upsertPaymentSecret(secret)
}

const SECONDS_10_DAYS = 60 * 60 * 24 * 10
export async function squareoAuthRefresh(conn: ScorekeeperProtocol, account: PaymentAccount) {
    try {
        const secret = await conn.payments.getPaymentAccountSecret(account.accountid)
        const tillexpire = (new Date(secret.attr.expires).getTime() - new Date().getTime()) / 1000
        if (tillexpire > SECONDS_10_DAYS) {
            console.debug(`no refresh needed for ${account.accountid}, till expire = ${tillexpire} seconds`)
            return
        }

        console.log(`Refreshing ${account.accountid}`)
        const SQ_APPLICATION_SECRET = await conn.payments.getSquareApplicationSecret()
        const authzclient   = getAClient(account.attr.mode)
        const tokenresponse = await new SquareConnect.OAuthApi(authzclient).obtainToken({
            client_id: account.attr.applicationid,
            client_secret: SQ_APPLICATION_SECRET,
            grant_type: 'refresh_token',
            refresh_token: secret.attr.refresh
        })

        if (!tokenresponse.access_token || !tokenresponse.expires_at) {
            throw new Error('no access token or expires in refresh response')
        }

        secret.secret = tokenresponse.access_token as string
        secret.attr.expires = tokenresponse.expires_at as string
        await conn.payments.updatePaymentAccountSecrets('update', [secret])
    } catch (error) {
        console.error(error)
    }
}
