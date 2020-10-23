import { Car } from '@/common/car'
import { Driver } from '@/common/driver'
import { db, pgdb, ScorekeeperProtocol } from '@/db'
import { controllog } from '@/util/logging'
import { Request, Response } from 'express'
import { allSeriesDeleteDriverLinks, getInactiveCars, getInactiveDrivers } from '../allseries'
import { AuthData, AUTHTYPE_ADMIN, AUTHTYPE_SERIES, checkAuth } from '../auth'

export async function seriesadmin(req: Request, res: Response) {
    try {
        const param = checkAuth(req)
        return res.json(await db.task('seriesadmin', async task => {
            if (![AUTHTYPE_SERIES, AUTHTYPE_ADMIN].includes(param.authtype)) {
                throw Error('Don\'t have the correct authtype')
            }
            switch (param.request) {
                case 'archive': return seriesarchive(task, param)
                case 'purge':   return seriespurge(task, param, req.auth)
            }

            throw Error(`unknown seriesadmin request: ${param.request}`)
        }))
    } catch (error) {
        if (error.authtype) {
            res.status(401).json({ error: error.message, types: error.types })
        } else {
            controllog.error(error)
            res.status(500).send({ error: error.message })
        }
    }
}

async function seriesarchive(task: ScorekeeperProtocol, param: any): Promise<any> {
    if (param.series !== param.verifyseries) {
        throw Error('Series name verification failed')
    }
    await task.series.setSeries(param.series)
    await task.results.cacheAll()
    await pgdb.series.dropSeries(param.series)
    return {}
}

async function seriespurge(task: ScorekeeperProtocol, param: any, auth: AuthData): Promise<any> {
    await task.series.setSeries(param.series)
    if (param.type === 'driver') auth.requireAdmin()

    if (param.estimateid) {
        let count = 0
        switch (param.type) {
            case 'class':  count = (await task.cars.searchByClass(param.arg)).length; break
            case 'year':   count = (await getInactiveCars(task, param.series, param.arg)).length; break
            case 'driver': count = (await getInactiveDrivers(task, param.arg)).length; break
        }
        return {
            estimateid: param.estimateid,
            count: count
        }
    } else {
        const ret = {
            type:    'delete', // match normal api interface
            series:  param.series,
            cars:    [] as Car[],
            drivers: [] as Driver[]
        }
        switch (param.type) {
            case 'class':  ret.cars = await task.cars.deleteByClass(param.arg); break
            case 'year':   ret.cars = await task.cars.deleteById(await getInactiveCars(task, param.series, param.arg)); break
            case 'driver':
                // eslint-disable-next-line no-case-declarations
                const ids = await getInactiveDrivers(task, param.arg)
                Object.assign(ret, await allSeriesDeleteDriverLinks(task, ids))
                ret.drivers = await task.drivers.deleteById(ids)
                break
        }
        return ret
    }
}
