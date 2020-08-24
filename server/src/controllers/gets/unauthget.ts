import { ScorekeeperProtocol } from '@/db'
import { SQ_APPLICATION_ID, RECAPTCHA_SITEKEY } from '@/db/generalrepo'

export async function unauthget(db: ScorekeeperProtocol, item: any, ret: any): Promise<boolean> {
    switch (item) {
        case 'serieslist':      ret.serieslist      = await db.series.seriesList();             break
        case 'listids':         ret.listids         = await db.series.emailListIds();           break
        case 'events':          ret.events          = await db.series.eventList();              break
        case 'counts':          ret.counts          = await db.register.getRegistationCounts(); break
        case 'classes':         ret.classes         = await db.clsidx.classList();              break
        case 'indexes':         ret.indexes         = await db.clsidx.indexList();              break
        case 'paymentitems':    ret.paymentitems    = await db.payments.getPaymentItems();      break
        case 'paymentaccounts': ret.paymentaccounts = await db.payments.getPaymentAccounts();   break

        case 'squareapplicationid': ret.squareapplicationid = await db.general.getLocalSetting(SQ_APPLICATION_ID); break
        case 'recaptchasitekey':    ret.recaptchasitekey    = await db.general.getLocalSetting(RECAPTCHA_SITEKEY); break
        default: return false
    }
    return true
}
