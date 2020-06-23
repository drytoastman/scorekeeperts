import { db } from '../db'
import * as square from '../util/square'

export async function oauthrefresh() {
    try {
        await db.task('oauthfinish', async t => {
            for (const series of await t.series.seriesList()) {
                t.series.setSeries(series)
                for (const account of await t.payments.getPaymentAccounts()) {
                    if ((account.type === 'square') && (account.attr.version === 2)) {
                        console.log(account)
                        await square.squareoAuthRefresh(t, account)
                    }
                }
            }
        })
    } catch (error) {
        console.log(error)
    }
}
