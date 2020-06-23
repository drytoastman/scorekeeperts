import nodemailer from 'nodemailer'
import { MAIL_SEND_USER, MAIL_SEND_PASS, MAIL_SEND_HOST, MAIL_SEND_FROM, MAIL_SEND_REPLYTO } from '../db/generalrepo'
import { db } from '../db'

let smtp

export async function createMailer() {
    // create reusable transporter object using the default SMTP transport
    // let user: string, pass: string, host: string
    await db.task(async t => {
        const user = await t.general.getLocalSetting(MAIL_SEND_USER)
        const pass = await t.general.getLocalSetting(MAIL_SEND_PASS)
        const host = await t.general.getLocalSetting(MAIL_SEND_HOST)

        if (!user || !pass || !host) {
            console.error(`Unable to create smtp mailer with (${user}, ${pass}, ${host})`)
            return
        }

        smtp = nodemailer.createTransport({
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
    })
}


createMailer()
export async function sendEmail() {
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

