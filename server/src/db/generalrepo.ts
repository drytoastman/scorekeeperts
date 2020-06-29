import { IDatabase } from 'pg-promise'
import KeyGrip from 'keygrip'
import bcrypt from 'bcryptjs'

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

    async getKeyGrip(): Promise<KeyGrip> {
        const rows = await this.db.any('SELECT value FROM localsettings WHERE key LIKE $1 ORDER BY key DESC', ['KEYGRIP%'])
        if (rows.length === 0) {
            throw Error('No keys to create KeyGrip')
        }
        return new KeyGrip(rows.map(r => r.value))
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
