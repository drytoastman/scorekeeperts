import _ from 'lodash'

import { ScorekeeperProtocol } from '@/db'

export async function allSeriesSummary(db: ScorekeeperProtocol, driverid: string): Promise<any[]> {
    const ret:any[] = []
    for (const series of await db.series.seriesList()) {
        await db.series.setSeries(series)
        ret.push(...(await db.register.getRegistrationSummary(driverid)).map(v => Object.assign(v, { series: series })))
    }
    return _.sortBy(ret, ['date'])
}
