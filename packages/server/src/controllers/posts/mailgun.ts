import crypto from 'crypto'
import { Request, Response } from 'express'
import { db } from 'scdb'
import { MG_WEBHOOK_KEY } from 'scdb/generalrepo'
import { cronlog } from '../../util/logging'

export async function mailgunwebhook(req: Request, res: Response) {
    await db.task(async t => {
        const webhookKey = await t.general.getLocalSetting(MG_WEBHOOK_KEY)

        const sig = req.body.signature
        const check = crypto.createHmac('sha256', webhookKey).update(sig.timestamp.concat(sig.token)).digest('hex')
        if (sig.signature !== check) {
            cronlog.error('mailgun webhook signature verification failed')
            return res.status(406).json('signature verification failed')
        }

        const ev = req.body['event-data']
        if (ev.event === 'failed' && ev.severity === 'permanent') {
            const reason = ev['delivery-status'].message || ev['delivery-status'].description
            cronlog.error(`mailgun failure: ${ev.recipient}: ${ev.reason} - ${reason}`)
            await t.general.addEmailFilter(ev.recipient)
        } else if (ev.event === 'rejected') {
            cronlog.error(`mailgun rejection: ${ev.recipient}: ${ev.reject.reason}`)
        } else if (ev.event === 'delivered') {
            cronlog.info(`mailgun delivered: ${ev.recipient}`)
        }

        return res.status(200).json('ok')
    })
}
