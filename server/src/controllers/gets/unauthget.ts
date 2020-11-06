import fs from 'fs'
import util from 'util'

import { ScorekeeperProtocol } from '@/db'
import { SQ_APPLICATION_ID, RECAPTCHA_SITEKEY, IS_MAIN_SERVER } from '@/db/generalrepo'
import { AuthData } from '../auth'

const readdirAsync = util.promisify(fs.readdir)

export async function unauthget(task: ScorekeeperProtocol, auth: AuthData, param: any) {
    const ret: any = {
        type: 'get',
        series: param.series,
        success: true
    }

    for (const item of param.items) {
        ret.success = ret.success && await unauthgetone(task, auth, item, ret)
    }

    return ret
}

export async function unauthgetone(task: ScorekeeperProtocol, auth: AuthData, item: any, ret: any): Promise<boolean> {
    let res = true

    // things that don't require a series
    switch (item) {
        case 'authinfo':            ret.authinfo            = auth.authflags(); break
        case 'listids':             ret.listids             = await task.series.emailListIds(); break
        case 'serieslist':          ret.serieslist          = await task.series.seriesList();   break
        case 'squareapplicationid': ret.squareapplicationid = await task.general.getLocalSetting(SQ_APPLICATION_ID); break
        case 'ismainserver':        ret.ismainserver        = await task.general.getLocalSetting(IS_MAIN_SERVER) === '1'; break
        case 'paxlists':            ret.paxlists            = (await readdirAsync('public')).filter(f => f.endsWith('.json')); break
        case 'recaptchasitekey':
            if (await task.general.isMainServer()) {
                ret.recaptchasitekey = await task.general.getLocalSetting(RECAPTCHA_SITEKEY)
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
            case 'events':          ret.events          = await task.events.eventList();              break
            case 'counts':          ret.counts          = await task.register.getRegistationCounts(); break
            case 'classes':         ret.classes         = await task.clsidx.classList();              break
            case 'indexes':         ret.indexes         = await task.clsidx.indexList();              break
            case 'paymentitems':    ret.paymentitems    = await task.payments.getPaymentItems();      break
            case 'itemeventmap':    ret.itemeventmap    = await task.payments.getItemMaps();          break
            case 'paymentaccounts': ret.paymentaccounts = await task.payments.getPaymentAccounts();   break
            case 'classorder':      ret.classorder      = await task.clsidx.classOrder();             break
            default: res = false
        }
    }

    // true we matched something, false we didn't
    return res
}
