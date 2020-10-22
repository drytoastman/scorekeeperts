import { db } from '../db'
import * as square from '../util/square'
import { cronlog } from '../util/logging'

export async function oauthrefresh() {
    try {
        await db.task('oauthfinish', async t => {
            for (const series of await t.series.seriesList()) {
                await t.series.setSeries(series)
                for (const account of await t.payments.getPaymentAccounts()) {
                    if ((account.type === 'square') && (account.attr.version === 2)) {
                        cronlog.debug(account)
                        await square.squareoAuthRefresh(t, account)
                    }
                }
            }
        })
    } catch (error) {
        cronlog.error(error)
    }
}
