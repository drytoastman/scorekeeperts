import _ from 'lodash'

import { ScorekeeperProtocol } from '@/db'
import { UUID } from '@common/util'
import { Car } from '@common/car'

export async function allSeriesSummary(db: ScorekeeperProtocol, driverid: string): Promise<any[]> {
    const ret:any[] = []
    for (const series of await db.series.seriesList()) {
        await db.series.setSeries(series)
        ret.push(...(await db.register.getRegistrationSummary(driverid)).map(v => Object.assign(v, { series: series })))
    }
    return _.sortBy(ret, ['date'])
}


export async function allSeriesCars(db: ScorekeeperProtocol, driverids: UUID[]): Promise<Car[]> {
    const ret:Car[] = []
    for (const series of await db.series.seriesList()) {
        await db.series.setSeries(series)
        for (const c of await db.cars.getCarsbyDriverIds(driverids)) {
            ret.push(Object.assign(c, { series: series }))
        }
    }
    return ret
}
