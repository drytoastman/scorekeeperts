import { ScorekeeperProtocol } from '@/db'
import { SQ_APPLICATION_ID, RECAPTCHA_SITEKEY } from '@/db/generalrepo'

export async function unauthget(db: ScorekeeperProtocol, item: any, ret: any): Promise<boolean> {
    let res = true

    // things that don't require a series
    switch (item) {
        case 'listids':             ret.listids             = await db.series.emailListIds(); break
        case 'serieslist':          ret.serieslist          = await db.series.seriesList();   break
        case 'squareapplicationid': ret.squareapplicationid = await db.general.getLocalSetting(SQ_APPLICATION_ID); break
        case 'recaptchasitekey':
            if (await db.general.isMainServer()) {
                ret.recaptchasitekey = await db.general.getLocalSetting(RECAPTCHA_SITEKEY)
            } else {
                ret.recaptchasitekey = 'norecaptcha'
            }
            break
        default: res = false
    }

    if (!res && ret.series) {
        // try again with things that require a series if one is provided
        res = true
        switch (item) {
            case 'events':          ret.events          = await db.series.eventList();              break
            case 'counts':          ret.counts          = await db.register.getRegistationCounts(); break
            case 'classes':         ret.classes         = await db.clsidx.classList();              break
            case 'indexes':         ret.indexes         = await db.clsidx.indexList();              break
            case 'paymentitems':    ret.paymentitems    = await db.payments.getPaymentItems();      break
            case 'paymentaccounts': ret.paymentaccounts = await db.payments.getPaymentAccounts();   break
            default: res = false
        }
    }

    // true we matched something, false we didn't
    return res
}
