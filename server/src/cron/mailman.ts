import _ from 'lodash'
import imaps from 'imap-simple'
import { simpleParser }  from 'mailparser'
import nodemailer from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'

import { db } from '../db'
import { MAIL_SEND_USER, MAIL_SEND_PASS, MAIL_SEND_HOST, MAIL_SEND_FROM, MAIL_SEND_REPLYTO, MAIL_RECEIVE_USER, MAIL_RECEIVE_PASS, MAIL_RECEIVE_HOST } from '../db/generalrepo'

async function createSender(): Promise<Mail> {
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
        console.error(error)
        throw error
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
        console.error(error)
        throw error
    })
}

let smtp, imapConfig
async function init() {
    smtp = await createSender()
    imapConfig = await createReceiverConfig()
}
init()

export async function sendQueuedEmail() {
    if (!smtp) { return }

    await db.task(async t => {
        const from    = await t.general.getLocalSetting(MAIL_SEND_FROM)
        const replyto = await t.general.getLocalSetting(MAIL_SEND_REPLYTO)

        while (true) {
            const email = await t.general.firstQueuedEmail()
            if (!email) { break }

            // send mail with defined transport object
            await smtp.sendMail({
                from:    `"Admin via Scorekeeper" <${from}>`,
                replyTo: `"Scorekeeper Admin" <${replyto}>`,
                to:      email.content.recipient,
                subject: email.content.subject,
                html:    email.content.body
            })

            t.general.deleteQueuedEmail(email.mailid)
        }
    }).catch(error => {
        console.error(error)
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

    for (const item of messages) {
        var all = _.find(item.parts, { which: '' })
        if (!all) continue
        processMessage(all.body)
    }
}

async function processMessage(data: Buffer) {
    try {
        const parsed = await simpleParser(data)
        for (const attachment of parsed.attachments) {
            if (attachment.contentType === 'message/delivery-status') {
                const a1 = await simpleParser(attachment.content)
                const a2 = await simpleParser(Buffer.from(a1.text as string))
                const allheaders = new Map([...a1.headers, ...a2.headers])
                const status = Number((allheaders.get('status') as string || '2.0.0')[0])
                if (status >= 4) {
                    console.log('Mailman Error Report:')
                    allheaders.forEach((v, k) => { console.log(`    ${k}: ${v}`) })
                    if (status >= 5) {
                        let email = allheaders.get('original-recipient')!.toString()
                        if (email.includes(';')) {
                            email = email.split(';')[1]
                            await db.general.addEmailFilter(email)
                        }
                        console.log(`ban ${email}`)
                    }
                }
                break
            }
        }
    } catch (error) {
        console.log('parse error: ' + error)
    }
}
