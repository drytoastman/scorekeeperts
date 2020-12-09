import _ from 'lodash'
import imaps from 'imap-simple'
import { simpleParser }  from 'mailparser'
import nodemailer from 'nodemailer'

import { db, ScorekeeperProtocol } from '../db'
import { MAIL_SEND_USER, MAIL_SEND_PASS, MAIL_SEND_HOST, MAIL_SEND_FROM, MAIL_SEND_REPLYTO } from '../db/generalrepo'
import { cronlog } from '../util/logging'

let sendingQueued = false
export async function sendQueuedEmail() {
    let smtp: nodemailer.Transporter
    if (sendingQueued) return
    sendingQueued = true

    await db.task(async t => {
        const settings = await t.general.getLocalSettingsObj()
        const user    = settings[MAIL_SEND_USER]
        const pass    = settings[MAIL_SEND_PASS]
        const host    = settings[MAIL_SEND_HOST]
        const from    = settings[MAIL_SEND_FROM]
        const replyto = settings[MAIL_SEND_REPLYTO]

        if (!user || !pass || !host) {
            throw Error(`Unable to create smtp mailer with (${user}, ${pass}, ${host})`)
        }

        smtp = nodemailer.createTransport({
            host: host,
            port: 587,
            secure: false, // will still run STARTTLS, just after connect
            auth: {
                user: user,
                pass: pass
            },
            pool: true
        })

        while (true) {
            const email = await t.general.firstQueuedEmail()
            if (!email) { break }

            // send mail with defined transport object
            const r = email.content.recipient
            await smtp.sendMail({
                from:    `"Admin via Scorekeeper" <${from}>`,
                replyTo: `"Scorekeeper Admin" <${replyto}>`,
                to:      `"${r.firstname} ${r.lastname}" <${r.email}>`,
                subject: email.content.subject,
                html:    email.content.body
            })

            await t.general.deleteQueuedEmail(email.mailid)
        }
    }).catch(error => {
        cronlog.error(error)
    }).finally(() => {
        if (smtp) smtp.close()
        sendingQueued = false
    })
}

/**
 * This is only checking the mailman account for delivery failure notices
 */
let checkingMail = false
export async function checkMailmanErrors() {
    if (checkingMail) return
    checkingMail = true
    let connection: imaps.ImapSimple

    await db.task(async t => {
        const settings = await t.general.getLocalSettingsObj()
        const user    = settings[MAIL_SEND_USER]
        const pass    = settings[MAIL_SEND_PASS]
        const host    = settings[MAIL_SEND_HOST]

        if (!user || !pass || !host) {
            throw Error(`Unable to create iamp receiver with (${user}, ${pass}, ${host})`)
        }

        const imapConfig = {
            imap: {
                user: user,
                password: pass,
                host: host,
                port: 993,
                tls: true,
                authTimeout: 3000
            }
        }

        connection = await imaps.connect(imapConfig)
        await connection.openBox('INBOX')
        const messages   = await connection.search(['ALL'], { bodies: ['HEADER', 'TEXT', ''] })
        cronlog.debug('checkmail: %d messsages', messages.length)

        for (const item of messages) {
            const all = _.find(item.parts, { which: '' })
            if (!all) continue
            if (await processMessage(t, all.body)) {
                await (connection as any).deleteMessage(item.attributes.uid) // missing stuff from their types file
            }
        }

    }).catch(error => {
        cronlog.error(error)
    }).finally(() => {
        checkingMail = false
        if (connection) connection.end()
    })
}


async function processMessage(t: ScorekeeperProtocol, data: Buffer): Promise<boolean> {
    try {
        const parsed = await simpleParser(data)
        for (const attachment of parsed.attachments) {
            if (attachment.contentType === 'message/delivery-status') {
                const a1 = await simpleParser(attachment.content)
                const a2 = await simpleParser(Buffer.from(a1.text as string))
                const allheaders = new Map([...a1.headers, ...a2.headers])
                const status = Number((allheaders.get('status') as string || '2.0.0')[0])
                if (status >= 4) {
                    cronlog.warn('Mailman Error Report:')
                    allheaders.forEach((v, k) => { cronlog.warn(`    ${k}: ${v}`) })
                    if (status >= 5) {
                        let email = (allheaders.get('original-recipient') || allheaders.get('final-recipient')) as string
                        if (email && email.includes(';')) {
                            email = email.split(';')[1]
                            cronlog.warn(`ban ${email}`)
                            await t.general.addEmailFilter(email.trim())
                        }
                    }
                }
                break
            }
        }
        return true
    } catch (error) {
        cronlog.error('parse error: %s', error)
        return false
    }
}
