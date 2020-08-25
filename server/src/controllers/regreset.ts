import _ from 'lodash'
import axios from 'axios'
import dns from 'dns'
import { Request, Response } from 'express'
import KeyGrip from 'keygrip'

import { RegisterValidator, ResetValidator } from '@common/driver'
import { validateObj } from '@common/util'
import { db } from '@/db'
import { wrapObj } from '@/util/statelessdata'
import { controllog } from '@/util/logging'
import { IS_MAIN_SERVER, RECAPTCHA_SECRET } from '@/db/generalrepo'


async function verifyCaptcha(req: Request, secret: string): Promise<void> {
    // await verifyCaptcha(req.auth, req.body.recaptcha, captchasecret)
    if (req.body.admin && req.auth.hasAnySeriesAuth()) {
        return
    }
    const resp = await axios.post('https://www.google.com/recaptcha/api/siteverify', `secret=${secret}&response=${req.body.recaptcha}`)
    if (!resp.data.success) {
        throw Error(`ReCaptcha verification failed: ${resp.data['error-codes']}`)
    } else {
        controllog.info('Recaptcha vertification success')
    }
}


export async function register(req: Request, res: Response) {
    try {
        validateObj(req.body, RegisterValidator)

        const request = {
            request:   'register',
            firstname: req.body.firstname.trim(),
            lastname:  req.body.lastname.trim(),
            email:     req.body.email.trim(),
            username:  req.body.username.trim(),
            password:  req.body.password
        }
        const token = wrapObj(req.sessionOptions.keys as KeyGrip, request)
        // Do most db lookup in one task
        let ismain: boolean, filter: boolean|null, captchasecret: string
        try {
            [ismain, filter, captchasecret] = await db.task(async t => {
                if ((await t.drivers.getDriverByNameEmail(req.body.firstname, req.body.lastname, req.body.email)).length) {
                    throw Error('That combination of name/email already exists, please use the reset tab instead')
                }
                if ((await t.drivers.getDriverByUsername(req.body.username)).length) {
                    throw Error('That username is already taken')
                }
                const ismain = await db.general.getLocalSetting(IS_MAIN_SERVER) === '1'
                const filter = await db.general.getEmailFilterMatch(request.email)
                const secret = await db.general.getLocalSetting(RECAPTCHA_SECRET)
                return [ismain, filter, secret]
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
            await verifyCaptcha(req, captchasecret)

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
            controllog.warn(`Ignore request ${request.email} ${ip}: ${error}`)
            return res.status(400).json({ error: 'Request filtered due to suspicious parameters' })
        }

        return res.status(200).json({ emailresult: _.pick(request, ['firstname', 'lastname', 'email']) })

    } catch (error) {
        res.status(500).json({ error: error.toString() })
    }
}


export async function reset(req: Request, res: Response) {
    try {
        validateObj(req.body, ResetValidator)
        const request = {
            request: 'reset',
            firstname: req.body.firstname.trim(),
            lastname:  req.body.lastname.trim(),
            email:     req.body.email.trim()
        }

        const token = wrapObj(req.sessionOptions.keys as KeyGrip, request)

        // Do most db lookup in one task
        let ismain: boolean, captchasecret: string
        try {
            [ismain, captchasecret] = await db.task(async t => {
                const driver = await t.drivers.getDriverByNameEmail(request.firstname, request.lastname, request.email)
                if (!driver) throw Error('No user could be found with those parameters')
                const ismain = await db.general.getLocalSetting(IS_MAIN_SERVER) === '1'
                const secret = await db.general.getLocalSetting(RECAPTCHA_SECRET)
                return [ismain, secret]
            })
        } catch (error) {
            controllog.error(error)
            return res.status(400).json({ error: error.toString() })
        }

        if (!ismain) {
            throw Error('Reset only works from main server')
        }

        try {
            await verifyCaptcha(req, captchasecret)
            const url  = `https://${req.hostname}/register2/reset?token=${token}`
            const body = `<h3>Scorekeeper Username and Password Reset</h3>
                            <p>Use the following link to continue the reset process.</p>
                            <a href='${url}'>${url}</a>`

            await db.general.queueEmail({
                subject: 'Scorekeeper Reset Request',
                recipient: request,
                body: body
            })
        } catch (error) {
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
            controllog.warn(`Ignore reset ${request.email} ${ip}: ${error}`)
            return res.status(400).json({ error: 'Request filtered due to suspicious parameters' })
        }

        return res.status(200).json({ emailresult: request })

    } catch (error) {
        res.status(500).json({ error: error.toString() })
    }
}
