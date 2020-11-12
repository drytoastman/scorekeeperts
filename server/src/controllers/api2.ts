import _ from 'lodash'
import { Router, Request, Response } from 'express'
import delay from 'express-delay'
import icalgen from 'ical-generator'
import moment from 'moment'

import { db } from '@/db'
import { controllog } from '@/util/logging'

import { login, logout, AuthData, serieslogin, adminlogin, adminlogout, checkAuth } from './auth'
import { changepassword, register, reset, token } from './posts/regreset'
import { cards } from './gets/cards'
import { logs } from './gets/logs'
import { driverget } from './gets/driverget'
import { seriesget } from './gets/seriesget'
import { driverpost } from './posts/driverpost'
import { seriespost } from './posts/seriespost'
import { seriesadmin } from './posts/seriesadmin'
import { AUTHTYPE_DRIVER, AUTHTYPE_NONE, AUTHTYPE_SERIES } from '@/common/auth'
import { unauthget } from './gets/unauthget'
import { allSeriesSummary } from './allseries'

export const api2 = Router()

if (process.env.NODE_ENV === 'development') {
    controllog.warn('Using development environment fake delay')
    api2.use(delay(500))
} else {
    controllog.info('Using production environment')
}

api2.use(async function(req: Request, res: Response, next: Function) {
    if (!req.session) {
        return res.status(500).json({ error: 'no session available' })
    }
    req.auth = new AuthData(req.session as any)
    next()
})


function defaultget(authtype: string) {
    const COMMONDEFAULT = ['classes', 'counts', 'events', 'indexes', 'listids', 'paymentaccounts', 'paymentitems', 'itemeventmap', 'serieslist', 'settings']
    const SERIESDEFAULT = [...COMMONDEFAULT, 'classorder', 'localsettings', 'squareapplicationid', 'ismainserver', 'paxlists']
    const DRIVERDEFAULT = [...COMMONDEFAULT, 'cars', 'drivers', 'payments', 'registered', 'summary', 'unsubscribe', 'driversattr']
    switch (authtype) {
        case AUTHTYPE_DRIVER: return DRIVERDEFAULT
        case AUTHTYPE_SERIES: return SERIESDEFAULT
    }
    return []
}

export async function apiget(req: Request, res: Response) {
    let param
    try {
        res.json(await db.task('apiget', async task => {
            try {
                param = checkAuth(req)
                param.items = param.items ? param.items.split(',') : defaultget(param.authtype)
            } catch (error) {
                if (error.param) {
                    // for apigets, try unauthget on authfail for unauth items
                    error.param.items = error.param.items.split(',') // don't add defaults, must be specific
                    const res = await unauthget(task, req.auth, error.param)
                    if (res.success) return res
                }
                throw error
            }

            switch (param.authtype) {
                case AUTHTYPE_DRIVER: return await driverget(task, req.auth, param)
                case AUTHTYPE_SERIES: return await seriesget(task, req.auth, param)
                case AUTHTYPE_NONE:   return await unauthget(task, req.auth, param)
                default: throw Error('Unknown authtype')
            }
        }))
    } catch (error) {
        if (error.authtype) {
            res.status(401).json({ error: error.message, authtype: error.authtype })
        } else {
            controllog.error(error)
            const match = error.message.match(/relation "(.*)" does not exist/)
            const msg = (match) ? `Invalid series ${param.series} (${match[1]} does not exist)` : error.message
            res.status(500).json({ error: msg })
        }
    }
}

export async function apipost(req: Request, res: Response) {
    try {
        const param = checkAuth(req)
        res.json(await db.tx('apipost', async tx => {
            switch (param.authtype) {
                case AUTHTYPE_DRIVER: return driverpost(tx, req.auth.driverId(), param)
                case AUTHTYPE_SERIES: return seriespost(tx, req.auth, param)
            }
            throw Error('Unknown authtype')
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

export async function ical(req: Request, res: Response) {
    try {
        const driverid = req.params.driverid
        const cal = icalgen({
            prodId: { company: 'drytoastman', product: 'Scorekeeper Registration' },
            name: 'Scorekeeper Registration',
            method: 'PUBLISH'
        })

        for (const e of await allSeriesSummary(db, driverid)) {
            const date = moment(e.date)
            cal.createEvent({
                start: date,
                summary: `${e.name} ${e.reg.map(r => r.classcode).join(', ')}`,
                uid: `SCAL-${driverid}-${e.name.replace(/\W/g, '')}-${date.format('YYYY-MM-DD')}`
            })
        }

        cal.serve(res)
    } catch (error) {
        controllog.error(error)
        res.status(500).json({ error: error.toString() })
    }
}


// items where we don't care about being pre authenticated
api2.post('/login', login)
api2.get('/logout', logout)
api2.post('/token',    token)
api2.post('/register', register)
api2.post('/reset',    reset)
api2.post('/serieslogin', serieslogin)
api2.post('/adminlogin',  adminlogin)
api2.get('/adminlogout',  adminlogout)
api2.get('/ical/:driverid', ical)

// Authenticated items
api2.get('/', apiget)
api2.post('/', apipost)

api2.get('/cards', cards)
api2.get('/logs', logs)
api2.post('/changepassword', changepassword)
api2.post('/seriesadmin', seriesadmin)
