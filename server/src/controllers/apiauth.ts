import _ from 'lodash'
import { Request, Response } from 'express'

import { db } from '../db'
import { UUID } from '@common/util'

declare global {
    module Express {
        interface Request {
            auth: AuthData
        }
    }
}

type CookieSess = CookieSessionInterfaces.CookieSessionObject;
export class AuthData {
    session: CookieSess

    constructor(session: CookieSess) {
        this.session = session
        if (!this.session.driverid) {
            this.session.driverid = null
        }
        if (!this.session.series) {
            this.session.series = {}
        }
        if (!this.session.admin) {
            this.session.admin = null
        }
    }

    driverAuthenticated(driverid: UUID) { this.session.driverid = driverid }
    hasDriverAuth()                     { return this.session.driverid != null }
    driverId()                          { return this.session.driverid }
    clearDriver()                       { this.session.driverid = null }

    seriesAuthenticated(series: string) { this.session.series[series] = true }
    clearSeries(series: string)         { delete this.session.series[series] }
    clearAllSeries()                    { this.session.series = {} }
    hasSeriesAuth(series: string)       { return series in this.session.series || this.session.admin === true }
    requireSeries(series: string)       { if (!this.hasSeriesAuth(series)) { throw new Error(`Series auth for ${series} failed`) } }

    adminAuthenticated()                { this.session.admin = true }
    hasAdminAuth()                      { return this.session.admin === true }
    clearAdmin()                        { this.session.admin = null }
    requireAdmin()                      { if (!this.hasAdminAuth()) { throw new Error('Admin auth required for this request') } }
}


export async function login(req: Request, res: Response) {
    try {
        req.auth.driverAuthenticated(await db.drivers.checkLogin(req.body.username, req.body.password))
        res.status(200).json({ result: 'authenticated' })
    } catch (error) {
        res.status(401).json({ error: error.toString() })
    }
}

export async function logout(req: Request, res: Response) {
    req.auth.clearDriver()
    res.status(200).json({ result: 'logged out' })
}

export async function serieslogin(req: Request, res: Response) {
    try {
        await db.series.checkSeriesLogin(req.body.series, req.body.password)
        req.auth.seriesAuthenticated(req.body.series)
        res.status(200).json({ result: 'authenticated' })
    } catch (error) {
        res.status(401).json({ error: error.toString() })
    }
}

export async function adminlogin(req: Request, res: Response) {
    try {
        if (await db.general.checkAdminPassword(req.body.password)) {
            req.auth.adminAuthenticated()
            res.status(200).json({ result: 'authenticated' })
        } else {
            throw Error('Admin password incorrect')
        }
    } catch (error) {
        res.status(401).json({ error: error.toString() })
    }
}

export async function adminlogout(req: Request, res: Response) {
    req.auth.clearAdmin()
    req.auth.clearAllSeries()
    res.status(200).json({ result: 'logged out' })
}

export async function changepassword(req: Request, res: Response) {
    try {
        await db.drivers.changePassword(req.auth.driverId(), req.body.currentpassword, req.body.newpassword)
        res.status(200).json({ result: 'Password change successful' })
    } catch (error) {
        res.status(500).json({ error: error.toString() })
    }
}

export const UNAUTH = ['serieslist', 'recaptchasitekey']
export const COMMONITEMS  = [
    'serieslist', 'listids', 'classes', 'indexes',
    'events', 'paymentaccounts', 'paymentitems', 'counts'
]
export const SERIESEXTRA    = ['squareapplicationid', 'settings', 'attendance', 'localsettings', 'rotatekeygrip', 'driverbrief', 'editorids']
export const DRIVEREXTRA    = ['summary', 'drivers', 'payments', 'registered', 'cars', 'unsubscribe']

export const NO_SERIES_FILTER = ['serieslist',
    'drivers', 'listids', 'summary', 'unsubscribe',
    'carids', 'editorids', 'driverbrief', 'driverids', 'localsettings', 'recaptchasitekey', 'rotatekeygrip'
]

export class AuthError extends Error {
    authtype: string
    constructor(message: string, authtype: string) {
        super(message)
        this.authtype = authtype
    }
}

export function checkAuth(req: Request): any {
    let param
    if (req.method === 'GET') {
        // Use query param, delete anything in body
        req.body = {}
        param = req.query
    } else if (req.method === 'POST') {
        // Use the body param, delete anything in query
        req.query = {}
        param = req.body
    } else {
        throw new AuthError('unknown method', '')
    }

    const authtype = param.authtype // driver or series
    const series   = param.series

    if (req.method === 'GET') {
        // only unauth items, skip by auth checks
        const items = param.items ? param.items.split(',') : ['blankmeansmorestufflater']
        if (items.filter((v: string) => !UNAUTH.includes(v)).length === 0) {
            param.items = items
            return param
        }
    }

    if (authtype === 'driver') {
        if (!req.auth.hasDriverAuth()) {
            throw new AuthError('not authenticated', 'driver')
        }
    } else if (authtype === 'series') {
        if (!req.auth.hasSeriesAuth(series)) {
            throw new AuthError('not authenticated', 'series')
        }
    } else if (authtype === 'admin') {
        if (!req.auth.hasAdminAuth()) {
            throw new AuthError('not authenticated', 'admin')
        }
    } else {
        throw new AuthError('unknown authtype', authtype)
    }

    if (req.method === 'GET') {
        param.items = param.items ? param.items.split(',') : []
        if (param.items.length === 0) {
            if (authtype === 'series') {
                param.items = [...COMMONITEMS, ...SERIESEXTRA]
            } else {
                param.items = [...COMMONITEMS, ...DRIVEREXTRA]
            }
        }
        if (!series) {
            param.items = param.items.filter(val => NO_SERIES_FILTER.includes(val))
        }

    } else { // POST
        if (!series) {
            param.items = _.pick(param.items, NO_SERIES_FILTER)
        }
    }

    return param
}
