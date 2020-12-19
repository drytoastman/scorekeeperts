import { IMain } from 'pg-promise'
import KeyGrip from 'keygrip'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { dblog, ScorekeeperProtocolDB } from '.'

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
export const KEYGRIP = 'KEYGRIP'
export const RECAPTCHA_SECRET = 'RECAPTCHA_SECRET'
export const RECAPTCHA_SITEKEY = 'RECAPTCHA_SITEKEY'

const viewable = [
    MAIL_SEND_USER, MAIL_SEND_HOST, MAIL_SEND_FROM, MAIL_SEND_REPLYTO, MAIL_RECEIVE_USER, MAIL_RECEIVE_HOST,
    IS_MAIN_SERVER, SQ_APPLICATION_ID, RECAPTCHA_SITEKEY
]

export class SchemaError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'SchemaError'
    }
}

export class GeneralRepository {
    constructor(private db: ScorekeeperProtocolDB, private pgp: IMain) {
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

    async isMainServer(): Promise<boolean> {
        return ((await this.getLocalSetting(IS_MAIN_SERVER)) === '1')
    }

    async getLocalSetting(key: string): Promise<string> {
        const row = await this.db.oneOrNone('SELECT value FROM localsettings WHERE key=$1', [key])
        return row ? row.value : ''
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
        return rows.filter(s => !(s.key === KEYGRIP))
    }

    async getLocalSettingsObj(): Promise<{[key: string]: string}> {
        const ret = {}
        const rows = await this.db.any('SELECT * FROM localsettings')
        for (const row of rows) {
            ret[row.key] = row.value
        }
        return ret
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
        const row = await this.db.one('SELECT value FROM localsettings WHERE key=$1', [KEYGRIP])
        return new KeyGrip(row.value.split(','))
    }

    async rotateKeyGrip(): Promise<void> {
        dblog?.info('Rotating keygrip keys')
        const row     = await this.db.one('SELECT value FROM localsettings WHERE key=$1', [KEYGRIP])
        const current = row.value.split(',')
        const size    = 5

        // Make sure its full enough and remove the last entry
        while (current.length < size + 1) {
            current.unshift(crypto.randomBytes(32).toString('base64'))
        }
        current.pop()
        await this.db.none('UPDATE localsettings SET value=$1 WHERE key=$2', [current.join(','), KEYGRIP])
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
        if (rows.length) { return rows[0].drop }
        return null // no vote, different than yes or no vote
    }

    async getSchemaVersion(): Promise<string> {
        const res = await this.db.oneOrNone('SELECT version FROM version')
        if (!res) throw new SchemaError('no schema verison present in database')
        return res.version
    }
}
