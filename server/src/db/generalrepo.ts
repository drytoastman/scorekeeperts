import { IDatabase } from 'pg-promise'
import KeyGrip from 'keygrip'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export const IS_MAIN_SERVER = 'IS_MAIN_SERVER'
export const SQ_APPLICATION_ID = 'SQ_APPLICATION_ID'
export const SQ_APPLICATION_SECRET = 'SQ_APPLICATION_SECRET'
export const MAIL_SEND_USER = 'MAIL_SEND_USER'
export const MAIL_SEND_PASS = 'MAIL_SEND_PASS'
export const MAIL_SEND_HOST = 'MAIL_SEND_HOST'
export const MAIL_SEND_FROM = 'MAIL_SEND_FROM'
export const MAIL_SEND_REPLYTO = 'MAIL_SEND_REPLYTO'
export const MAIL_RECEIVE_USER = 'MAIL_RECEIVE_USER'
export const MAIL_RECEIVE_PASS = 'MAIL_RECEIVER_PASS'
export const MAIL_RECEIVE_HOST = 'MAIL_RECEIVE_HOST'
export const ADMIN_PASSWORD = 'ADMIN_PASSWORD'

const viewable = [
    MAIL_SEND_USER, MAIL_SEND_HOST, MAIL_SEND_FROM, MAIL_SEND_REPLYTO, MAIL_RECEIVE_USER, MAIL_RECEIVE_HOST,
    IS_MAIN_SERVER, SQ_APPLICATION_ID
]

export class GeneralRepository {
    // eslint-disable-next-line no-useless-constructor
    constructor(private db: IDatabase<any>) {
    }

    async checkAdminPassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, await this.getLocalSetting(ADMIN_PASSWORD))
    }

    async setAdminPassword(currentpassword: string, newpassword: string): Promise<void> {
        if (!bcrypt.compare(currentpassword, await this.getLocalSetting(ADMIN_PASSWORD))) {
            throw new Error('Current password was incorrect')
        }

        const hash = await bcrypt.hash(newpassword, 12)
        this.setLocalSetting(ADMIN_PASSWORD, hash)
    }

    async getLocalSetting(key: string): Promise<string> {
        const row = await this.db.one('SELECT value FROM localsettings WHERE key=$1', [key])
        return row.value
    }

    async setLocalSetting(key: string, value: string): Promise<null> {
        return await this.db.none('UPDATE localsettings SET value=$1 WHERE key=$2', [value, key])
    }

    async getLocalSettings(): Promise<any[]> {
        const rows = await this.db.any('SELECT * FROM localsettings')
        for (const row of rows) {
            if (!viewable.includes(row.key)) {
                row.value = ''
            }
        }
        return rows.filter(s => !s.key.startsWith('KEYGRIP'))
    }

    async updateLocalSettings(settings: any[]): Promise<any[]> {
        for (const s of settings) {
            if (!viewable.includes(s.key) && s.value === '') continue
            if (s.key === ADMIN_PASSWORD && s.value !== '') {
                s.value = await bcrypt.hash(s.value, 12)
            }
            await this.setLocalSetting(s.key, s.value)
        }
        return this.getLocalSettings()
    }


    async getKeyGrip(): Promise<KeyGrip> {
        const rows = await this.db.any('SELECT value FROM localsettings WHERE key LIKE \'KEYGRIP%\' ORDER BY key DESC')
        if (rows.length === 0) {
            throw Error('No keys to create KeyGrip')
        }
        return new KeyGrip(rows.map(r => r.value))
    }

    async rotateKeyGrip(): Promise<void> {
        const rows  = await this.db.any('SELECT key FROM localsettings WHERE key LIKE \'KEYGRIP%\' ORDER BY key DESC')
        const limit = 5

        let nextidx = -1
        if (rows.length > 0) {
            nextidx = parseInt(rows[0].key[7])
        }
        nextidx += 1
        await this.db.none('INSERT INTO localsettings (key, value) VALUES ($1, $2)', [`KEYGRIP${nextidx}`, crypto.randomBytes(32).toString('base64')])

        if (rows.length >= limit) {
            const toremove = rows.length - limit + 1
            await this.db.none('DELETE FROM localsettings WHERE key IN (SELECT key FROM localsettings WHERE key LIKE \'KEYGRIP%\' ORDER BY key LIMIT $1)', [toremove])
        }
    }

    async queueEmail(content: any): Promise<null> {
        return this.db.none('INSERT INTO emailqueue (content) VALUES ($1::json)', [content])
    }

    async firstQueuedEmail(): Promise<any|null> {
        return this.db.oneOrNone('SELECT * FROM emailqueue ORDER BY created LIMIT 1')
    }

    async deleteQueuedEmail(mailid: number) {
        return this.db.none('DELETE FROM emailqueue WHERE mailid=$1', [mailid])
    }

    async addEmailFilter(email: string) {
        return this.db.none('INSERT INTO emailfilter (forder, drop, match) VALUES ($1, $2, $3) ON CONFLICT (match) DO NOTHING', [50, true, email])
    }

    async getEmailFilterMatch(email: string): Promise<boolean|null> {
        // verbose version of matchend that postgres doesn't have
        const rows = await this.db.any('SELECT * from emailfilter WHERE substring(reverse($1),0,length(match)+1)=reverse(match) ORDER BY forder', [email])
        for (const r of rows) {
            return r.drop
        }
        return null // no vote, different than yes or no vote
    }
}
