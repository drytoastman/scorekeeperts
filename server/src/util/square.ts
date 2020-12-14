/* eslint-disable camelcase */
import { differenceInDays } from 'date-fns'
import { Client, Environment, CreateOrderResponse, ApiResponse, Money } from 'square'
import { v1 as uuidv1 } from 'uuid'

import { PaymentAccount, PaymentAccountSecret } from '@sctypes/payments'
import { Payment } from '@sctypes/register'
import { UUID } from '@sctypes/util'

import { ScorekeeperProtocol } from '@scdb'
import { gCache } from './cache'
import { SQ_APPLICATION_ID, SQ_APPLICATION_SECRET } from '@scdb/generalrepo'
import { paymentslog } from './logging'

function getAClient(mode: string, token?: string): Client {
    const client = new Client({
        environment: (mode === 'sandbox') ? Environment.Sandbox : Environment.Production,
        accessToken: token
    })
    return client
}

export async function squareOrder(conn: ScorekeeperProtocol, square: any, payments: Payment[], driverid: UUID): Promise<Payment[]> {

    let account: PaymentAccount
    let secret: PaymentAccountSecret
    try {
        account = await conn.payments.getPaymentAccount(square.accountid)
        secret  = await conn.payments.getPaymentAccountSecret(square.accountid)
    } catch (error) {
        paymentslog.error('error getting square account info: ' + error.message)
        throw new Error('error getting square account info from database')
    }

    const client  = getAClient(account.attr.mode, secret.secret)
    const refid   = uuidv1()
    const ikey2   = uuidv1()

    const body = {
        idempotencyKey: refid,
        order: {
            locationId: account.accountid,
            referenceId: refid,
            lineItems: [] as any
        }
    }

    for (const p of payments) {
        let event
        if (p.eventid) {
            event = await conn.events.getEvent(p.eventid)
        } else {
            event = { name: 'Membership Payments' }
        }
        body.order.lineItems.push({
            name: event.name,
            variationName: p.itemname,
            quantity: '1',
            basePriceMoney: {
                amount: p.amount,
                currency: 'USD'
            }
        })
    }

    let orderresponse: ApiResponse<CreateOrderResponse>
    try {
        orderresponse = await client.ordersApi.createOrder(body)
    } catch (error) {
        paymentslog.error('square setup issues: ' + error.message)
        throw new Error('square setup issues, notify admin')
    }

    // orderresponse.
    if (orderresponse.result.errors) {
        paymentslog.error('square order response errors: ' + orderresponse.result.errors)
        throw new Error(JSON.stringify(orderresponse.result.errors))
    }

    const sqpayment = {
        sourceId: square.nonce,
        idempotencyKey: ikey2,
        amountMoney: orderresponse.result.order?.totalMoney as Money,
        orderId: orderresponse.result.order?.id
    }

    const paymentresponse = await client.paymentsApi.createPayment(sqpayment)

    if (paymentresponse.result.errors) {
        paymentslog.error('Payment response errors: ' + orderresponse.result.errors)
        throw new Error(JSON.stringify(orderresponse.result.errors))
    }

    payments.forEach(p => {
        p.payid  = uuidv1()
        p.txtype = 'square'
        p.txid   = paymentresponse.result.payment?.id as string
        p.txtime = paymentresponse.result.payment?.createdAt as string
        p.accountid = account.accountid
        p.refunded = false
    })

    return conn.payments.updatePayments('insert', payments, driverid)
}


export async function squareRefund(conn: ScorekeeperProtocol, payments: Payment[]): Promise<Payment[]> {

    const account = await conn.payments.getPaymentAccount(payments[0].accountid)
    const secret  = await conn.payments.getPaymentAccountSecret(account.accountid)
    const client  = getAClient(account.attr.mode, secret.secret)
    const refid   = uuidv1()

    let total = 0
    const reasons:string[] = []
    for (const p of payments) {
        const event = await conn.events.getEvent(p.eventid)
        total += p.amount
        reasons.push(`${event.name} ${p.itemname}`)
        if (p.txid !== payments[0].txid) {
            throw Error('refund payments have different transaction ids')
        }
        if (p.accountid !== payments[0].accountid) {
            throw Error('refund payments have different account ids')
        }
    }

    const body = {
        idempotencyKey: refid,
        paymentId: payments[0].txid,
        amountMoney: {
            amount: total,
            currency: 'USD'
        },
        reason: reasons.join(', ')
    }

    const response = await client.refundsApi.refundPayment(body)

    if (response.result.errors) {
        paymentslog.error('Refund errors: ' + response.result.errors)
        throw new Error(JSON.stringify(response.result.errors))
    }

    payments.forEach(p => {
        p.refunded = true
    })

    return conn.payments.updatePayments('update', payments)
}


export async function squareoAuthRequest(conn: ScorekeeperProtocol, series: string, authorizationCode: string) {
    const client_id     = await conn.general.getLocalSetting(SQ_APPLICATION_ID)
    const client_secret = await conn.general.getLocalSetting(SQ_APPLICATION_SECRET)
    const create_mode   = client_id.includes('sandbox') ? 'sandbox' : 'production'
    const authzclient   = getAClient(create_mode)

    const tokenresponse = await authzclient.oAuthApi.obtainToken({
        clientId: client_id,
        clientSecret: client_secret,
        grantType: 'authorization_code',
        code: authorizationCode
    }).catch(error => {
        throw error.result || `Unknown error response from Square server: ${JSON.stringify(error)}`
    })

    if ((!tokenresponse.result.accessToken) || (!tokenresponse.result.refreshToken)) {
        throw new Error('token response is missing access or refresh token ' + tokenresponse)
    }

    const client = getAClient(create_mode, tokenresponse.result.accessToken)
    const locationResponse = await client.locationsApi.listLocations()

    if (locationResponse.result.errors) {
        throw new Error('Error getting locations: ' + locationResponse.result.errors)
    }
    if (locationResponse.result.locations?.length === 0) {
        throw new Error('No locations present, need at least one')
    }

    const requestid = uuidv1()
    const request = {
        secret: tokenresponse.result.accessToken,
        expires: tokenresponse.result.expiresAt,
        refresh: tokenresponse.result.refreshToken,
        locations: JSON.parse(JSON.stringify(locationResponse.result.locations)),
        series: series
    }
    gCache.set(requestid, request)

    return { requestid: requestid, locations: request.locations }
}


export async function squareoAuthFinish(conn: ScorekeeperProtocol, requestid: string, locationid: string) {
    const client_id     = await conn.general.getLocalSetting(SQ_APPLICATION_ID)
    const client_secret = await conn.general.getLocalSetting(SQ_APPLICATION_SECRET)
    const create_mode   = client_id.includes('sandbox') ? 'sandbox' : 'production'

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
            mode: create_mode,
            applicationid: client_id,
            merchantid: location[0].merchant_id,
            version: 2
        },
        modified: ''
    }

    const secret = {
        accountid: locationid,
        secret: request.secret,
        attr: {
            refresh: request.refresh,
            expires: request.expires,
            applicationsecret: client_secret
        },
        modified: ''
    }

    await conn.series.setSeries(request.series)
    await conn.payments.upsertPaymentAccount(account)
    await conn.payments.upsertPaymentSecret(secret)
}


export async function squareoAuthRefresh(conn: ScorekeeperProtocol, account: PaymentAccount) {
    try {
        if (!account.attr.applicationid) {
            throw Error('No square application id to refresh with')
        }
        const secret = await conn.payments.getPaymentAccountSecret(account.accountid)
        const tillexpire = differenceInDays(new Date(secret.attr.expires), new Date())
        if (tillexpire > 10) {
            paymentslog.debug(`no refresh needed for ${account.accountid}, expiry in ${tillexpire} days`)
            return
        }

        paymentslog.info(`Refreshing ${account.accountid}`)
        const authzclient   = getAClient(account.attr.mode)
        const tokenresponse = await authzclient.oAuthApi.obtainToken({
            clientId: account.attr.applicationid,
            clientSecret: secret.attr.applicationsecret,
            refreshToken: secret.attr.refresh,
            grantType: 'refresh_token'
        })

        if (!tokenresponse.result.accessToken || !tokenresponse.result.expiresAt) {
            throw new Error('no access token or expires in refresh response')
        }

        secret.secret = tokenresponse.result.accessToken as string
        secret.attr.expires = tokenresponse.result.expiresAt as string
        await conn.payments.updatePaymentAccountSecrets('update', [secret])
    } catch (error) {
        paymentslog.error(error.result || error)
    }
}
