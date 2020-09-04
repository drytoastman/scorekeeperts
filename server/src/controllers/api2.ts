import { Router, Request, Response } from 'express'
import delay from 'express-delay'

import { db } from '@/db'
import { controllog } from '@/util/logging'

import { login, logout, AuthData, serieslogin, adminlogin, adminlogout, checkAuth, AUTHTYPE_DRIVER, AUTHTYPE_SERIES, AUTHTYPE_ADMIN } from './auth'
import { changepassword, register, reset, token } from './posts/regreset'
import { cards } from './gets/cards'
import { logs } from './gets/logs'
import { driverget } from './gets/driverget'
import { seriesget } from './gets/seriesget'
import { driverpost } from './posts/driverpost'
import { seriespost } from './posts/seriespost'

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
    req.auth = new AuthData(req.session)
    next()
})

export async function apiget(req: Request, res: Response) {
    try {
        const param = checkAuth(req)
        res.json(await db.task('apiget-' + param.authtype, async task => {
            switch (param.authtype) {
                case AUTHTYPE_DRIVER:
                    return driverget(task, req.auth.driverId(), param)
                case AUTHTYPE_SERIES:
                case AUTHTYPE_ADMIN:
                    return seriesget(task, req.auth, param)
            }
            throw Error('Unknown authtype')
        }))
    } catch (error) {
        if (error.authtype) {
            res.status(401).json({ error: error.message, authtype: error.authtype })
        } else {
            controllog.error(error)
            res.status(500).json({ error: error.message })
        }
    }
}

export async function apipost(req: Request, res: Response) {
    try {
        const param = checkAuth(req)
        res.json(await db.tx('apipost', async tx => {
            switch (param.authtype) {
                case AUTHTYPE_DRIVER:
                    return driverpost(tx, req.auth.driverId(), param)
                case AUTHTYPE_SERIES:
                case AUTHTYPE_ADMIN:
                    return seriespost(tx, req.auth, param)
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


// items where we don't care about being pre authenticated
api2.post('/login', login)
api2.get('/logout', logout)
api2.post('/token',    token)
api2.post('/register', register)
api2.post('/reset',    reset)
api2.post('/serieslogin', serieslogin)
api2.post('/adminlogin',  adminlogin)
api2.get('/adminlogout',  adminlogout)

// Authenticated items
api2.get('/', apiget)
api2.post('/', apipost)

api2.get('/cards', cards)
api2.get('/logs', logs)
api2.post('/changepassword', changepassword)
