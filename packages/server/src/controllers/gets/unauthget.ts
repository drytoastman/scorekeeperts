import fs from 'fs'
import util from 'util'

import { ScorekeeperProtocol } from 'scdb'
import { SQ_APPLICATION_ID, RECAPTCHA_SITEKEY } from 'scdb/generalrepo'
import { AuthData } from '../auth'
import { generateProTimer, loadResultData } from './livedata'
import { LazyData } from '../lazydata'
import { LiveSocketWatch, watchNonTimers } from 'sctypes/results'
import { EPOCH } from 'sctypes/util'
import { gridTables } from 'sctypes/gridorder'

const readdirAsync = util.promisify(fs.readdir)

export async function unauthget(task: ScorekeeperProtocol, auth: AuthData, param: any) {
    const ret: any = {
        type: 'get',
        series: param.series,
        success: true
    }

    await task.series.setSeries(param.series)
    for (const item of param.items) {
        ret.success = ret.success && await unauthgetone(task, auth, param, item, ret)
    }

    return ret
}

export async function unauthgetone(task: ScorekeeperProtocol, auth: AuthData, param: any, item: any, ret: any): Promise<boolean> {
    let res = true

    // things that don't require a series
    switch (item) {
        case 'authinfo':            ret.authinfo            = auth.authflags(); break
        case 'listids':             ret.listids             = await task.series.emailListIds(); break
        case 'serieslist':          ret.serieslist          = await task.series.seriesList();   break
        case 'squareapplicationid': ret.squareapplicationid = await task.general.getLocalSetting(SQ_APPLICATION_ID); break
        case 'ismainserver':        ret.ismainserver        = await task.general.isMainServer(); break
        case 'paxlists':            ret.paxlists            = (await readdirAsync('public')).filter(f => f.endsWith('.json')); break
        case 'allseries':           ret.allseries           = await task.series.allSeries(); break
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
        let run
        let watch: LiveSocketWatch
        switch (item) {
            case 'events':          ret.events          = await task.events.eventList();              break
            case 'counts':          ret.counts          = await task.register.getRegistationCounts(); break
            case 'classes':         ret.classes         = await task.clsidx.classList();              break
            case 'indexes':         ret.indexes         = await task.clsidx.indexList();              break
            case 'paymentitems':    ret.paymentitems    = await task.payments.getPaymentItems();      break
            case 'itemeventmap':    ret.itemeventmap    = await task.payments.getItemMaps();          break
            case 'paymentaccounts': ret.paymentaccounts = await task.payments.getPaymentAccounts();   break
            case 'classorder':      ret.classorder      = await task.clsidx.classOrder();             break
            case 'seriesinfo':      ret.seriesinfo      = await task.results.getSeriesInfo();         break
            case 'champresults':    ret.champresults    = await task.results.getChampResults();       break
            case 'eventresults':
                ret.eventresults = Object.assign(await task.results.getEventResults(param.eventid), { _eventid: param.eventid })
                break
            case 'challengeresults':
                ret.challengeresults = await task.results.getChallengeResults(param.challengeid)
                break
            case 'gridtables':
                ret.gridtables = gridTables(
                                    (await task.clsidx.classOrder()).filter(c => c.eventid === param.eventid),
                                    (await task.clsidx.classList()).map(c => c.classcode),
                                    await task.register.getRegisteredCars(param.eventid),
                                    await task.drivers.getDriverMap(),
                                    param.order === 'position' ? await task.results.getEventResults(param.eventid) : undefined)
                break

            case 'live':
                watch = JSON.parse(param.watch)
                if (watch.protimer) Object.assign(ret, await generateProTimer())
                if (watch.timer)    ret.timer = await task.series.getLastTimer()
                if (watchNonTimers(watch)) {
                    run = await task.runs.getLastRun(param.eventid, EPOCH, watch.classcode, watch.course)
                    if (!run) break
                    Object.assign(ret, await loadResultData(new LazyData(task), watch, run))
                }
                break

            default:
                res = false
                break
        }
    }

    // true we matched something, false we didn't
    return res
}
