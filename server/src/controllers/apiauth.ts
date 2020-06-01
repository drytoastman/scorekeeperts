import _ from 'lodash'
import { Request, Response } from 'express'
import { db } from '../db'
import { UUID } from '@common/lib'

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
    }

    driverAuthenticated(driverid: UUID) { this.session.driverid = driverid }
    hasDriverAuth()                     { return this.session.driverid != null }
    driverId()                          { return this.session.driverid }
    clearDriver()                       { this.session.driverid = null }

    seriesAuthenticated(series: string) { this.session.series[series] = true }
    clearSeries(series: string)         { delete this.session.series[series] }
    hasSeriesAuth(series: string)       { return series in this.session.series }
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

export async function serieslogout(req: Request, res: Response) {
    req.auth.clearSeries(req.body.series)
    res.status(200).json({ result: 'logged out' })
}

export async function changepassword(req: Request, res: Response) {
    try {
        await db.drivers.changePassword(req.auth.driverId(), req.body.currentpassword, req.body.newpassword)
        res.status(200).json({ result: 'Password change successful' })
    } catch (error) {
        res.status(400).json({ error: error.toString() })
    }
}

export async function regreset(req: Request, res: Response) {
    try {
        res.status(200).json(req.query)
    } catch (error) {
        res.status(400).json({ error: error.toString() })
    }
}

export const SERIESLIST  = 'serieslist'
export const BOTHITEMS   = new Set(['emaillists', 'events', 'paymentaccounts', 'paymentitems', 'counts', 'classes', 'indexes'])
export const DRIVERITEMS = new Set<string>(['driver', 'summary', 'cars', 'registered', 'payments'])
export const SERIESITEMS = new Set<string>(['allcars'])
export const GLOBALITEMS = new Set<string>(['driver', 'emaillists', 'summary'])

class AuthError extends Error {
    types: string
    constructor(message: string, types: string) {
        super(message)
        this.types = types
    }
}

export function checkAuthItems(itemlist: string[], series: string, auth: AuthData) {

    if (_.isEqual(itemlist, [SERIESLIST])) {
        return itemlist
    }

    console.log(`auth (${series} ${auth.hasSeriesAuth(series)}), (driver ${auth.hasDriverAuth()})`)

    if ((!auth.hasDriverAuth()) && (!auth.hasSeriesAuth(series))) {  // For BOTH items
        throw new AuthError('not authenticated',  'driver,series')
    }

    if (!auth.hasDriverAuth()) {
        for (const item of itemlist.values()) {
            if (DRIVERITEMS.has(item)) {
                throw new AuthError('not authenticated', 'driver')
            }
        }
    }

    if (!auth.hasSeriesAuth(series)) {
        for (const item of itemlist.values()) {
            if (SERIESITEMS.has(item)) {
                throw new AuthError('not authenticated', 'series')
            }
        }
    }

    return itemlist
}
