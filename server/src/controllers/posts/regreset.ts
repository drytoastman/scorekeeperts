import dns from 'dns'
import { Request, Response } from 'express'
import KeyGrip from 'keygrip'
import isUUID from 'validator/lib/isUUID'

import { RegisterValidator, ResetValidator } from '@sctypes/driver'
import { validateObj } from '@sctypes/util'
import { db } from '@scdb'
import { wrapObj, unwrapObj } from '@/util/statelessdata'
import { controllog } from '@/util/logging'
import { MAIL_SEND_REPLYTO, MAIL_SEND_FROM } from '@scdb/generalrepo'
import { verifyCaptcha } from '../captcha'

async function emailresult(request: any): Promise<any> {
    const [from, replyto] = await db.task(async t => {
        return [await t.general.getLocalSetting(MAIL_SEND_FROM), await t.general.getLocalSetting(MAIL_SEND_REPLYTO)]
    })
    return {
        emailresult: {
            firstname: request.firstname,
            lastname: request.lastname,
            email: request.email,
            replyto: replyto,
            from: from
        }
    }
}


function tokenURL(req: Request, data: any): string {
    const proto = req.headers['x-forwarded-proto'] || 'https'
    const host  = req.headers['x-forwarded-host']
    const base  = req.headers.registerbase || '/register'
    if (!host) throw Error('No host field to build return URL')

    const [token, sig] = wrapObj(req.sessionOptions.keys as KeyGrip, data)
    return `${proto}://${host}${base}/token?t=${token}&s=${sig}`
}


export async function token(req: Request, res: Response) {
    try {
        let driver
        const request = unwrapObj(req.sessionOptions.keys as KeyGrip, req.body.token, req.body.signature)

        switch (request.type) {
            case 'register':
                validateObj(request, RegisterValidator)
                driver = await db.drivers.getDriverByUsername(request.username)
                if (driver) {
                    req.auth.driverAuthenticated(driver.driverid)
                    return res.json({ tokenresult: 'usernameexists' })
                }

                req.auth.driverAuthenticated(await db.drivers.createDriver(request))
                return res.json({ tokenresult: 'toprofileeditor' })

            case 'reset':
                if (!isUUID(request.driverid)) throw Error('invalid driverid')
                req.auth.driverAuthenticated(request.driverid)
                return res.json({ tokenresult: 'changepassword' })

            default:
                throw Error(`unknown token type: ${request.type}`)
        }
    } catch (error) {
        controllog.warn(error)
        return res.json({ tokenerror: error.toString() })
    }
}

export async function register(req: Request, res: Response) {
    try {
        validateObj(req.body, RegisterValidator)
        const request = {
            type:      'register',
            firstname: req.body.firstname.trim(),
            lastname:  req.body.lastname.trim(),
            email:     req.body.email.trim(),
            username:  req.body.username.trim(),
            password:  req.body.password
        }

        // Do most db lookup in one task
        let ismain: boolean, filter: boolean|null
        try {
            [ismain, filter] = await db.task(async t => {
                if (await t.drivers.getDriverByNameEmail(req.body.firstname, req.body.lastname, req.body.email)) {
                    throw Error('That combination of name/email already exists, please use the reset tab instead')
                }
                if (await t.drivers.getDriverByUsername(req.body.username)) {
                    throw Error('That username is already taken')
                }
                return [await t.general.isMainServer(), await t.general.getEmailFilterMatch(request.email)]
            })
        } catch (error) {
            controllog.error(error)
            return res.status(400).json({ error: error.toString() })
        }

        if (!ismain) {
            // Off main server (onsite), we let them register without the email verification, jump directly there
            req.auth.driverAuthenticated(await db.drivers.createDriver(request))
            return res.json({ tokenresult: 'toprofileeditor' })
        }

        try {
            await verifyCaptcha(req)
            if (filter === null) {
                await dns.promises.lookup(request.email.split('@').pop())
            } else if (filter === false) {
                throw Error('Email matched filter drop')
            }

            const url  = tokenURL(req, request)
            const body = `<h3>Scorekeeper Profile Creation</h3>
                          <p>Use the following link to complete the registration process</p>
                          <a href='${url}'>${url}</a>`

            await db.general.queueEmail({
                subject: 'Scorekeeper Profile Request',
                recipient: request,
                body: body
            })
        } catch (error) {
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
            controllog.warn(`Ignore request ${request.email} ${ip}: ${error}`)
            return res.status(400).json({ error: 'Request filtered due to suspicious parameters' })
        }

        return res.status(200).json(await emailresult(request))

    } catch (error) {
        controllog.error(error)
        res.status(500).json({ error: error.toString() })
    }
}


export async function reset(req: Request, res: Response) {
    try {
        validateObj(req.body, ResetValidator)
        const rcpt = {
            firstname: req.body.firstname.trim(),
            lastname:  req.body.lastname.trim(),
            email:     req.body.email.trim()
        }
        const request = {
            type: 'reset',
            driverid:  ''
        }

        try {
            if (!await db.general.isMainServer()) {
                throw Error('Reset only works from main server')
            }
            const d = await db.drivers.getDriverByNameEmail(rcpt.firstname, rcpt.lastname, rcpt.email)
            if (!d) {
                throw Error('No user could be found with those parameters')
            }
            request.driverid = d.driverid
        } catch (error) {
            controllog.error(error)
            return res.status(400).json({ error: error.toString() })
        }

        try {
            await verifyCaptcha(req)
            const url  = tokenURL(req, request)
            const body = `<h3>Scorekeeper Username and Password Reset</h3>
                          <p>Use the following link to continue the reset process.</p>
                          <a href='${url}'>${url}</a>`

            await db.general.queueEmail({
                subject: 'Scorekeeper Reset Request',
                recipient: rcpt,
                body: body
            })
        } catch (error) {
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
            controllog.warn(`Ignore reset ${rcpt.email} ${ip}: ${error}`)
            return res.status(400).json({ error: 'Request filtered due to suspicious parameters' })
        }

        return res.status(200).json(await emailresult(rcpt))

    } catch (error) {
        controllog.error(error)
        res.status(500).json({ error: error.toString() })
    }
}

export async function changepassword(req: Request, res: Response) {
    try {
        let reset = false
        const driverid = req.auth.driverId()
        if (!driverid) throw Error('No driverid in session')

        if (req.body.resetToken) {
            const o = unwrapObj(req.sessionOptions.keys as KeyGrip, req.body.resetToken.t, req.body.resetToken.s)
            if (o.driverid !== driverid) throw Error('token driverid and authorization driverid do not match')
            reset = true
        }
        await db.drivers.changePassword(driverid, req.body.currentpassword, req.body.newpassword, reset)
        res.status(200).json({ result: 'Password change successful' })
    } catch (error) {
        controllog.error(error)
        res.status(500).json({ error: error.toString() })
    }
}
