import _ from 'lodash'

import { ScorekeeperProtocol } from '@/db'
import { UUID } from '@common/util'
import { Car } from '@common/car'
import { SeriesEvent } from '@/common/event'
import { Entrant } from '@/common/results'
import { controllog } from '@/util/logging'
import { Driver } from '@/common/driver'
import { SeriesClass, SeriesIndex } from '@/common/classindex'

export async function allSeriesSummary(db: ScorekeeperProtocol, driverid: string) {
    const ret:any[] = []
    for (const series of await db.series.seriesList()) {
        await db.series.setSeries(series)
        ret.push(...(await db.register.getRegistrationSummary(driverid)).map(v => Object.assign(v, { series: series })))
    }
    return _.sortBy(ret, ['date'])
}

export async function allSeriesDeleteDriverLinks(db: ScorekeeperProtocol, driverids: UUID[]) {
    const ret = {
        cars: [] as Car[]
    }
    for (const series of await db.series.seriesList()) {
        await db.series.setSeries(series)
        await db.none('DELETE FROM unsubscribe WHERE driverid IN ($1:csv)', [driverids])
        ret.cars = [...ret.cars, ...await db.cars.deleteCarsbyDriverId(driverids)]
    }
    return ret
}

export async function allSeriesMerge(db: ScorekeeperProtocol, newid: UUID, oldids: UUID[]) {
    const ret = {
        cars: [] as Car[],
        drivers: [] as Driver[]
    }
    for (const series of await db.series.seriesList()) {
        await db.series.setSeries(series)
        for (const c of await db.cars.updateCarDriverIds(newid, oldids)) {
            c.series = series
            ret.cars.push(c)
        }
    }
    ret.drivers = await db.drivers.updateDriver('delete', oldids.map(id => ({ driverid: id } as Driver)), '')
    return ret
}

export async function allSeriesCars(db: ScorekeeperProtocol, driverids: UUID[]) {
    const ret:Car[] = []
    for (const series of await db.series.seriesList()) {
        await db.series.setSeries(series)
        for (const c of await db.cars.getCarsActivityForDriverIds(driverids)) {
            ret.push(Object.assign(c, { series: series }))
        }
    }
    return ret
}


export async function allClassesAndIndexes(db: ScorekeeperProtocol) {
    const ret = {} as {
        [key: string]: {
            classes: SeriesClass[]
            indexes: SeriesIndex[]
        }
    }
    for (const series of await db.series.seriesList()) {
        await db.series.setSeries(series)
        ret[series] = {
            classes: await db.clsidx.classList(),
            indexes: await db.clsidx.indexList()
        }
    }
    return ret
}


const yearmatch = /\d{2,}$/
function getYear(series: string) {
    const match = series.match(yearmatch)
    return match ? parseInt(match[0]) : 0
}

async function archiveActivity(task: ScorekeeperProtocol, key: string, untilyear: number) {
    const current = await task.series.seriesList()
    const archivedseries = (await task.map('SELECT DISTINCT series FROM results', null, r => r.series)).filter(s => !current.includes(s))
    const ids = new Set<UUID>()

    if (!untilyear) throw Error('No year provided for archive limit')
    for (const series of archivedseries) {
        if (getYear(series) < untilyear) continue

        const events: SeriesEvent[] = await task.one("select data->'events' as elist from results where name='info' and series=$1", [series], r => r.elist)
        for (const e of events) {
            try {
                const results = await task.one('select data from results where name=$1', [e.eventid], r => r.data)
                const edate = new Date(e.date)
                for (const [code, entries] of Object.entries(results)) {
                    for (const entrant of entries as Entrant[]) {
                        ids.add(entrant[key])
                    }
                }
            } catch (error) {
                controllog.error(error)
            }
        }
    }

    return ids
}

const activecarid = 'SELECT carid FROM runs UNION SELECT carid FROM registered UNION SELECT carid FROM payments UNION SELECT carid FROM challengeruns'

export async function getInactiveDrivers(task: ScorekeeperProtocol, untilyear: number) {
    // get the list of all driver ids as the 'inactive' start
    const inactive = new Set<UUID>(await task.map('SELECT driverid FROM drivers', null, d => d.driverid))

    // look through the active series and remove those
    for (const series of await task.series.seriesList()) {
        await task.series.setSeries(series)
        const found = await task.map(`SELECT d.driverid FROM drivers d JOIN cars c ON d.driverid=c.driverid WHERE c.carid IN (${activecarid})`, null, d => d.driverid)
        for (const did of found) {
            inactive.delete(did)
        }
    }

    const ids = await archiveActivity(task, 'driverid', untilyear)
    for (const id of ids) inactive.delete(id)

    return [...inactive]
}

export async function getInactiveCars(task: ScorekeeperProtocol, currentSeries: string, untilyear: number) {

    const activity = (positive:boolean) => `SELECT carid FROM cars WHERE carid ${positive ? '' : 'NOT'} IN (${activecarid})`

    // carids will be all the inactive ids in currentSeries
    await task.series.setSeries(currentSeries)
    const inactive: UUID[] = await task.map(activity(false), null, r => r.carid)
    const other = new Set<UUID>()

    // check other active series, remove things that have activity
    for (const series of await task.series.seriesList()) {
        if (series === currentSeries) continue
        await task.series.setSeries(series)
        const ids = await task.map(activity(true), null, r => r.carid)
        for (const id of ids) other.add(id)
    }

    // Any archived series that are less than X years old (need to search JSON data)
    const ids = await archiveActivity(task, 'carid', untilyear)
    for (const id of ids) other.add(id)

    // return the list filtered by things found in other locations
    await task.series.setSeries(currentSeries)
    return inactive.filter(cid => !other.has(cid))
}
