import { AUTHTYPE_SERIES } from 'sctypes/auth'
import { Car } from 'sctypes/car'
import { Driver } from 'sctypes/driver'
import { SeriesValidator } from 'sctypes/series'
import { errString, validateObj } from 'sctypes/util'
import { db, pgdb, ScorekeeperProtocol } from 'scdb'
import { controllog } from '@/util/logging'
import { Request, Response } from 'express'
import { allSeriesDeleteDriverLinks, getInactiveCars, getInactiveDrivers } from '../allseries'
import { AuthData, AuthError, checkAuth } from '../auth'

export async function seriesadmin(req: Request, res: Response) {
    try {
        const param = checkAuth(req)
        if (param.authtype !== AUTHTYPE_SERIES) {
            throw Error('Don\'t have the correct authtype')
        }

        return res.json(await db.task('seriesadmin', async task => {
            switch (param.request) {
                case 'archive':  return seriesarchive(task, param)
                case 'purge':    return seriespurge(task, param, req.auth)
                case 'password': return changeseriespassword(param, req.auth)
                case 'createseries': return createseries(param, req.auth)
            }
            throw Error(`unknown seriesadmin request: ${param.request}`)
        }))
    } catch (error) {
        if (error instanceof AuthError && error.authtype) {
            res.status(401).json({ error: error.message, types: error.param.types })
        } else {
            controllog.error(error)
            res.status(500).send({ error: errString(error) })
        }
    }
}

async function seriesarchive(task: ScorekeeperProtocol, param: any): Promise<any> {
    if (param.series !== param.verifyseries) {
        throw Error('Series name verification failed')
    }
    await task.series.setSeries(param.series, true)
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

async function changeseriespassword(param: any, auth: AuthData) {
    if (auth.hasAdminAuth()) {
        return await pgdb.series.forcePassword(param.series, param.newpassword)
    } else {
        return await pgdb.series.changePassword(param.series, param.currentpassword, param.newpassword)
    }
}

async function createseries(param: any, auth: AuthData): Promise<any> {
    validateObj(param, SeriesValidator)
    const ret = await pgdb.series.copySeries(param.series, param.name, param.password, param.options)
    auth.seriesAuthenticated(param.name)
    return ret
}
