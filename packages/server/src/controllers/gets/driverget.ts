import _ from 'lodash'
import { allSeriesSummary } from '../allseries'
import { ScorekeeperProtocol } from 'scdb'
import { unauthgetone } from './unauthget'
import { AuthData, AuthError } from '../auth'
import { AUTHTYPE_DRIVER } from 'sctypes/auth'

export async function driverget(task: ScorekeeperProtocol, auth: AuthData, param: any) {
    const ret: any = {
        type: 'get',
        series: param.series
    }

    const driverid = auth.driverId()
    await task.series.setSeries(ret.series, true)
    // if no series, remove driver only items that won't work
    if (!ret.series) param.items = param.items.filter((v:string) => !['settings', 'driversattr', 'cars', 'payments', 'registered', 'usednumbers'].includes(v))

    for (const item of param.items) {
        if (await unauthgetone(task, auth, param, item, ret)) continue
        if (!driverid) throw new AuthError(AUTHTYPE_DRIVER, param)

        switch (item) {
            case 'cars':        ret.cars              = await task.cars.getCarsbyDriverId(driverid);             break
            case 'drivers':     ret.drivers           = await task.drivers.getDriversById([driverid]);           break
            case 'payments':    ret.payments          = await task.payments.getPaymentsbyDriverId(driverid);     break
            case 'registered':  ret.registered        = await task.register.getRegistrationbyDriverId(driverid); break
            case 'unsubscribe': ret.driverunsubscribe = await task.drivers.getUnsubscribeByDriverId(driverid);   break
            case 'driversattr': ret.driversattr       = await task.drivers.getDriverSeriesAttr(driverid);        break
            case 'settings':
                ret.settings = _.pick(await task.series.seriesSettings(), [
                    'classinglink', 'seriesruleslink', 'requestrulesack', 'rulesackbeforereg',
                    'requestbarcodes', 'requestmembership', 'membershipaccount'
                ])
                break
            case 'usednumbers':
                ret.usednumbers = await task.register.usedNumbers(driverid, param.classcode, await task.series.superUniqueNumbers())
                break
            case 'summary':
                ret.summary = await allSeriesSummary(task, driverid)
                await task.series.setSeries(ret.series)
                break
        }
    }

    return ret
}
