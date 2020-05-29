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
export const DRIVERITEMS = new Set<string>(['driver', 'emaillists', 'summary', 'events', 'cars', 'registered',
    'payments', 'counts', 'classes', 'indexes', 'paymentaccounts', 'paymentitems'])
export const SERIESITEMS = new Set<string>()
export const GLOBALITEMS = new Set<string>([SERIESLIST, 'driver', 'emaillists', 'summary'])
export const BOTHITEMS   = new Set([...DRIVERITEMS].filter(val => SERIESITEMS.has(val)))
export const DRIVERONLY  = new Set([...DRIVERITEMS].filter(val => !SERIESITEMS.has(val)))
export const SERIESONLY  = new Set([...SERIESITEMS].filter(val => !DRIVERITEMS.has(val)))

export function checkAuthItems(itemlist: string[], series: string, auth: AuthData) {

    // If there is no series,  filter out things that are not global
    if (!series) {
        itemlist = itemlist.filter(val => GLOBALITEMS.has(val))
    }

    if ((!auth.hasDriverAuth()) && (!auth.hasSeriesAuth(series))) {
        for (const item of itemlist.values()) {
            if (BOTHITEMS.has(item)) {
                throw Error('not authenticated for any data')
            }
        }
    }

    if (!auth.hasDriverAuth()) {
        for (const item of itemlist.values()) {
            if (DRIVERONLY.has(item)) {
                throw Error('not authenticated for driver data')
            }
        }
    }

    if (!auth.hasSeriesAuth(series)) {
        for (const item of itemlist.values()) {
            if (SERIESONLY.has(item)) {
                throw Error('not authenticated for series data')
            }
        }
    }

    return itemlist
}
