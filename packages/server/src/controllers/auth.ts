import _ from 'lodash'
import { Request, Response } from 'express'
import { db } from 'scdb'
import { UUID } from 'sctypes/util'
import { AUTHTYPE_DRIVER, AUTHTYPE_NONE, AUTHTYPE_SERIES } from 'sctypes/auth'

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
    namespace Express {
        interface Request {
            auth: AuthData
        }
    }
}
/* eslint-enable @typescript-eslint/no-namespace */

export interface CookieSess {
    driverid: UUID|null
    series: {[key: string]: boolean}
    admin: boolean|null
}

export class AuthData {
    private session: CookieSess

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

    hasAnyAuth()  {
        return !!this.session.driverid || !!this.session.admin || _.reduce(this.session.series, (r:boolean, v) => r || v, false)
    }

    authflags() {
        return {
            driver: !!this.session.driverid,
            series: this.session.series,
            admin:  !!this.session.admin
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

export class AuthError extends Error {
    authtype: string
    param: any
    constructor(authtype: string, param: any) {
        super('not authenticated')
        this.authtype = authtype
        this.param = param
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
        throw new Error('unknown api request method')
    }

    const authtype = param.authtype // driver or series
    const series   = param.series
    switch (authtype) {
        case AUTHTYPE_DRIVER:
            if (!req.auth.hasDriverAuth()) throw new AuthError(AUTHTYPE_DRIVER, param)
            break
        case AUTHTYPE_SERIES:
            if (!req.auth.hasSeriesAuth(series)) throw new AuthError(AUTHTYPE_SERIES, param)
            break
        case AUTHTYPE_NONE:
            break
        default:
            throw new Error(`unknown authtype ${authtype}`)
    }

    return param
}
