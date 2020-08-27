import { allSeriesSummary } from '../allseries'
import { ScorekeeperProtocol } from '@/db'
import { UUID } from '@common/util'
import { unauthget } from './unauthget'

export async function driverget(task: ScorekeeperProtocol, driverid: UUID, param: any) {
    const ret: any = {
        type: 'get',
        series: param.series
    }

    await task.series.setSeries(ret.series)
    // if no series, remove driver only items that won't work
    if (!ret.series) param.items = param.items.filter((v:string) => !['cars', 'payments', 'registered', 'usednumbers'].includes(v))

    for (const item of param.items) {
        if (await unauthget(task, item, ret)) continue

        switch (item) {
            case 'cars':        ret.cars              = await task.cars.getCarsbyDriverId(driverid);             break
            case 'drivers':     ret.drivers           = await task.drivers.getDriversById([driverid]);           break
            case 'payments':    ret.payments          = await task.payments.getPaymentsbyDriverId(driverid);     break
            case 'registered':  ret.registered        = await task.register.getRegistrationbyDriverId(driverid); break
            case 'unsubscribe': ret.driverunsubscribe = await task.drivers.getUnsubscribeByDriverId(driverid);   break
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
