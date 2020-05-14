import axios, { AxiosResponse } from 'axios'
import { base64encode } from 'nodejs-base64'
import { DBExtensions } from '../db'
import { ITask } from 'pg-promise'

const PAYPAL_OAUTH_API = 'https://api.sandbox.paypal.com/v1/oauth2/token/'
const PAYPAL_ORDER_API = 'https://api.sandbox.paypal.com/v2/checkout/orders/'

export async function paypalCapture(task: ITask<DBExtensions> & DBExtensions, accountid: string, orderid: string) {

    const secret = await task.payments.getPaymentSecret(accountid)
    const basicAuth = base64encode(`${accountid}:${secret}`)
    const auth = await axios.post(PAYPAL_OAUTH_API, 'grant_type=client_credentials', {
        headers: {
            Authorization: `Basic ${basicAuth}`
        }
    })

    let capture: AxiosResponse<any>
    try {
        capture = await axios.post(PAYPAL_ORDER_API + orderid + '/capture', '', {
            headers: {
                Authorization: `Bearer ${auth.data.access_token}`,
                Accept: 'application/json',
                'Content-Type': 'application/json'
            }
        })

        const data = capture.data
        console.log(JSON.stringify(data))
        if (!data.error) {
            const captureID = data.purchase_units[0].payments.captures[0].id
            // database.saveCaptureID(captureID);
        }
        if (data.error) {
            console.error(data.error)
        }
    } catch (error) {
        console.log(JSON.stringify(error))
    }
}
