import _ from 'lodash'
import { Request, Response } from 'express'
import { db } from '@/db'
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
    hasAnySeriesAuth()                  { return Object.keys(this.session.series).length > 1 || this.session.admin === true }
    hasSeriesAuth(series: string)       { return series in this.session.series || this.session.admin === true }
    requireSeries(series: string)       { if (!this.hasSeriesAuth(series)) { throw new Error(`Series auth for ${series} failed`) } }

    adminAuthenticated()                { this.session.admin = true }
    hasAdminAuth()                      { return this.session.admin === true }
    clearAdmin()                        { this.session.admin = null }
    requireAdmin()                      { if (!this.hasAdminAuth()) { throw new Error('Admin auth required for this request') } }

    adminTypes() {
        return {
            driver: this.session.driverid,
            series: this.session.series,
            admin: this.session.admin
        }
    }
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

export async function authtest(req: Request, res: Response) {
    res.status(200).json({ authtypes: req.auth.adminTypes() })
}

// 'allclassindex', 'attendance', 'driverbrief', 'editorids', 'rotatekeygrip',

const UNAUTHSPECIAL = ['recaptchasitekey', 'serieslist']
const COMMONDEFAULT = ['classes', 'counts', 'events', 'indexes', 'listids', 'paymentaccounts', 'paymentitems', 'serieslist']
const SERIESDEFAULT = [...COMMONDEFAULT, 'classorder', 'localsettings',  'settings', 'squareapplicationid', 'ismainserver']
const DRIVERDEFAULT = [...COMMONDEFAULT, 'cars', 'drivers', 'payments', 'registered', 'summary', 'unsubscribe']

export const AUTHTYPE_DRIVER = 'driver'
export const AUTHTYPE_SERIES = 'series'
export const AUTHTYPE_ADMIN  = 'admin'
const BLANK = ['BLANK']

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
        param.items = param.items ? param.items.split(',') : BLANK
        // only special unauth items, skip by auth checks
        if (param.items.filter((v: string) => !UNAUTHSPECIAL.includes(v)).length === 0) {
            return param
        }
    }

    switch (authtype) {
        case AUTHTYPE_DRIVER:
            if (!req.auth.hasDriverAuth()) throw new AuthError('not authenticated', AUTHTYPE_DRIVER)
            if (_.isEqual(param.items, BLANK)) param.items = DRIVERDEFAULT
            break
        case AUTHTYPE_SERIES:
            if (!req.auth.hasSeriesAuth(series)) throw new AuthError('not authenticated', AUTHTYPE_SERIES)
            if (_.isEqual(param.items, BLANK)) param.items = SERIESDEFAULT
            break
        case AUTHTYPE_ADMIN:
            if (!req.auth.hasAdminAuth()) throw new AuthError('not authenticated', AUTHTYPE_ADMIN)
            if (_.isEqual(param.items, BLANK)) param.items = SERIESDEFAULT
            break
        default:
            throw new AuthError('unknown authtype', authtype)
    }

    return param
}
