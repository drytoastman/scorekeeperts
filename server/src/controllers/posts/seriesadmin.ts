import { db, pgdb, ScorekeeperProtocol } from '@/db'
import { controllog } from '@/util/logging'
import { Request, Response } from 'express'
import { AUTHTYPE_ADMIN, AUTHTYPE_SERIES, checkAuth } from '../auth'

export async function seriesadmin(req: Request, res: Response) {
    try {
        const param = checkAuth(req)
        res.json(await db.task('seriesadmin', async task => {
            if (![AUTHTYPE_SERIES, AUTHTYPE_ADMIN].includes(param.authtype)) {
                throw Error('Don\'t have the correct authtype')
            }
            switch (param.request) {
                case 'archive':
                    return seriesarchive(task, param)
            }
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

async function seriesarchive(task: ScorekeeperProtocol, param: any) {
    if (param.series !== param.verifyseries) {
        throw Error('Series name verification failed')
    }
    await task.series.setSeries(param.series)
    await task.results.cacheAll()
    await pgdb.series.dropSeries(param.series)
    return {}
}
