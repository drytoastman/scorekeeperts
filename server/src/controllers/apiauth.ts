import _ from 'lodash'
import dns from 'dns'
import { Request, Response } from 'express'
import KeyGrip from 'keygrip'

import { db } from '../db'
import { wrapObj } from '../util/statelessdata'
import { IS_MAIN_SERVER } from '../db/generalrepo'
import { controllog } from '../util/logging'
import { UUID, validateObj } from '@common/util'
import { RegisterValidator } from '@common/driver'

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

export async function regreset(req: Request, res: Response) {
    try {
        if (req.body.type === 'register') {
            validateObj(req.body, RegisterValidator)

            const request = {
                request: 'register',
                firstname: req.body.firstname.trim(),
                lastname: req.body.lastname.trim(),
                email: req.body.email.trim(),
                username: req.body.username.trim(),
                password: req.body.password
            }
            const token = wrapObj(req.sessionOptions.keys as KeyGrip, request)
            // Do most db lookup in one task
            let ismain: boolean, filter: boolean|null
            try {
                [ismain, filter] = await db.task(async t => {
                    if ((await t.drivers.getDriverByNameEmail(req.body.firstname, req.body.lastname, req.body.email)).length) {
                        throw Error('That combination of name/email already exists, please use the reset tab instead')
                    }
                    if ((await t.drivers.getDriverByUsername(req.body.username)).length) {
                        throw Error('That username is already taken')
                    }
                    const ismain = await db.general.getLocalSetting(IS_MAIN_SERVER) === '1'
                    const filter = await db.general.getEmailFilterMatch(request.email)
                    return [ismain, filter]
                })
            } catch (error) {
                controllog.error(error)
                return res.status(400).json({ error: error.toString() })
            }

            if (!ismain) {
                // Off main server (onsite), we let them register without the email verification, jump directly there
                // request.args = dict(token=token)
                // return finish()
                throw Error('on site not implemented yet')
            }

            try {
                if (filter === null) {
                    if (/[<>+]/.test(request.email.includes)) {
                        throw Error('Bad char in email and not whitelisted')
                    }
                    await dns.promises.lookup(request.email.split('@').pop())
                } else if (filter === false) {
                    throw Error('Email matched filter drop')
                }

                const url  = `https://${req.hostname}/register2/finish?token=${token}`
                const body = `  <h3>Scorekeeper Profile Creation</h3>
                                <p>Use the following link to complete the registration process</p>
                                <a href='${url}'>${url}</a>`

                await db.general.queueEmail({
                    subject: 'Scorekeeper Profile Request',
                    recipient: request,
                    body: body
                })
            } catch (error) {
                const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
                controllog.warn(`Ignore ${request.email} ${ip}`)
                return res.status(400).json({ error: 'Request filtered due to suspicious parameters' })
            }
        }
        res.status(200).json(req.query)
    } catch (error) {
        res.status(500).json({ error: error.toString() })
    }
}

export const SERIESLIST   = 'serieslist'
export const COMMONITEMS  = [
    SERIESLIST, 'listids', 'classes', 'indexes',
    'events', 'paymentaccounts', 'paymentitems', 'counts'
]
export const SERIESEXTRA    = ['squareapplicationid', 'settings', 'attendance']
export const DRIVEREXTRA    = ['summary', 'drivers', 'payments', 'registered', 'cars', 'unsubscribe']
export const API_NON_SERIES = [SERIESLIST, 'drivers', 'summary', 'listids', 'unsubscribe']

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
        if (param.items === SERIESLIST) { // always allow plain series list
            param.items = [SERIESLIST]
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
            param.items = param.items.filter(val => API_NON_SERIES.includes(val))
        }

    } else { // POST
        if (!series) {
            param.items = _.pick(param.items, API_NON_SERIES)
        }
    }

    return param
}
