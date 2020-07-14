import _ from 'lodash'
import imaps from 'imap-simple'
import { simpleParser }  from 'mailparser'
import nodemailer from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'

import { db } from '../db'
import { MAIL_SEND_USER, MAIL_SEND_PASS, MAIL_SEND_HOST, MAIL_SEND_FROM, MAIL_SEND_REPLYTO, MAIL_RECEIVE_USER, MAIL_RECEIVE_PASS, MAIL_RECEIVE_HOST } from '../db/generalrepo'
import { cronlog } from '../util/logging'

async function createSender(): Promise<Mail|null> {
    // create reusable transporter object using the default SMTP transport
    // let user: string, pass: string, host: string
    return await db.task(async t => {
        const user = await t.general.getLocalSetting(MAIL_SEND_USER)
        const pass = await t.general.getLocalSetting(MAIL_SEND_PASS)
        const host = await t.general.getLocalSetting(MAIL_SEND_HOST)

        if (!user || !pass || !host) {
            throw Error(`Unable to create smtp mailer with (${user}, ${pass}, ${host})`)
        }

        return nodemailer.createTransport({
            host: host,
            port: 587,
            secure: false, // will still run STARTTLS, just after connect
            auth: {
                user: user,
                pass: pass
            }
        })
    }).catch(error => {
        cronlog.error(error)
        return null
    })
}

async function createReceiverConfig(): Promise<any> {
    // create reusable transporter object using the default SMTP transport
    // let user: string, pass: string, host: string
    return await db.task(async t => {
        const user = await t.general.getLocalSetting(MAIL_RECEIVE_USER)
        const pass = await t.general.getLocalSetting(MAIL_RECEIVE_PASS)
        const host = await t.general.getLocalSetting(MAIL_RECEIVE_HOST)

        if (!user || !pass || !host) {
            throw Error(`Unable to create iamp receiver with (${user}, ${pass}, ${host})`)
        }

        return {
            imap: {
                user: user,
                password: pass,
                host: host,
                port: 993,
                tls: true,
                authTimeout: 3000
            }
        }
    }).catch(error => {
        cronlog.error(error)
        return {}
    })
}

let smtp, imapConfig
export async function mailmaninit() {
    smtp = await createSender()
    imapConfig = await createReceiverConfig()
}

export async function sendQueuedEmail() {
    if (!smtp) { return }

    await db.task(async t => {
        const from    = await t.general.getLocalSetting(MAIL_SEND_FROM)
        const replyto = await t.general.getLocalSetting(MAIL_SEND_REPLYTO)

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
    })
}


/**
 * This is only checking the mailman account for delivery failure notices
 */
export async function checkMailmanErrors() {
    if (!imapConfig) { return }

    const connection = await imaps.connect(imapConfig)
    const inbox      = await connection.openBox('INBOX')
    const messages   = await connection.search(['ALL'], { bodies: ['HEADER', 'TEXT', ''] })
    cronlog.debug('checkmail: %d messsages', messages.length)

    for (const item of messages) {
        var all = _.find(item.parts, { which: '' })
        if (!all) continue
        if (await processMessage(all.body)) {
            await (connection as any).deleteMessage(item.attributes.uid) // missing stuff from their types file
        }
    }

    connection.end()
}

async function processMessage(data: Buffer): Promise<boolean> {
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
                        let email = allheaders.get('original-recipient')!.toString()
                        if (email.includes(';')) {
                            email = email.split(';')[1]
                            cronlog.warn(`ban ${email}`)
                            await db.general.addEmailFilter(email)
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
