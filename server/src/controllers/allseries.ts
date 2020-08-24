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

export async function allSeriesDeleteDriverLinks(db: ScorekeeperProtocol, driverids: UUID[]): Promise<void> {
    for (const series of await db.series.seriesList()) {
        await db.series.setSeries(series)
        for (const id of driverids) {
            await db.cars.deleteCarsbyDriverId(id)
        }
    }
}

export async function allSeriesMerge(db: ScorekeeperProtocol, newid: UUID, oldids: UUID[]): Promise<any> {
    const ret = { cars: [] as Car[] }
    for (const series of await db.series.seriesList()) {
        await db.series.setSeries(series)
        for (const c of await db.cars.updateCarDriverIds(newid, oldids)) {
            c.series = series
            ret.cars.push(c)
        }
    }
    await db.drivers.updateDriver('delete', oldids.map(id => ({ driverid: id } as any)), '')
    return ret
}

export async function allSeriesCars(db: ScorekeeperProtocol, driverids: UUID[]): Promise<Car[]> {
    const ret:Car[] = []
    for (const series of await db.series.seriesList()) {
        await db.series.setSeries(series)
        for (const c of await db.cars.getCarsActivityForDriverIds(driverids)) {
            ret.push(Object.assign(c, { series: series }))
        }
    }
    return ret
}


export async function allClassesAndIndexes(db: ScorekeeperProtocol): Promise<object> {
    const ret = {}
    for (const series of await db.series.seriesList()) {
        await db.series.setSeries(series)
        ret[series] = {
            classes: await db.clsidx.classList(),
            indexes: await db.clsidx.indexList()
        }
    }
    return ret
}
