import { ScorekeeperProtocol } from '@/db'

import { allClassesAndIndexes } from '../allseries'
import { AuthData } from '../auth'
import { unauthget } from './unauthget'

export async function seriesget(task: ScorekeeperProtocol, auth: AuthData, param: any) {
    const ret: any = {
        type: 'get',
        series: param.series
    }

    await task.series.setSeries(ret.series)
    for (const item of param.items) {
        if (await unauthget(task, item, ret)) continue

        switch (item) {
            case 'attendance':    ret.attendance = await task.runs.attendance(); break
            case 'cars':          ret.cars = await task.cars.getAllCars(); break
            case 'drivers':       ret.drivers = await task.drivers.getAllDrivers();  break
            case 'driverbrief':   ret.driverbrief = await task.drivers.getDriversBrief(); break
            case 'localsettings': ret.localsettings = await task.general.getLocalSettings(); break
            case 'payments':      ret.payments = await task.payments.getAllPayments(param.eventid); break
            case 'registered':    ret.registered = await task.register.getAllRegistration(param.eventid); break
            case 'settings':      ret.settings = await task.series.seriesSettings(); break
            case 'usednumbers':
                ret.usednumbers = await task.register.usedNumbers(param.driverid, param.classcode, await task.series.superUniqueNumbers())
                break
            case 'allclassindex':
                ret.allclassindex = await allClassesAndIndexes(task)
                await task.series.setSeries(ret.series)
                break
        }
    }

    return ret
}
