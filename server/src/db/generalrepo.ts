import { IDatabase } from 'pg-promise'
import KeyGrip from 'keygrip'
import { keys } from 'lodash'

export const IS_MAIN_SERVER = 'IS_MAIN_SERVER'
export const SQ_APPLICATION_ID = 'SQ_APPLICATION_ID'
export const SQ_APPLICATION_SECRET = 'SQ_APPLICATION_SECRET'
export const MAIL_SEND_USER = 'MAIL_SEND_USER'
export const MAIL_SEND_PASS = 'MAIL_SEND_PASS'
export const MAIL_SEND_HOST = 'MAIL_SEND_HOST'
export const MAIL_SEND_FROM = 'MAIL_SEND_FROM'
export const MAIL_SEND_REPLYTO = 'MAIL_SEND_REPLYTO'

export class GeneralRepository {
    // eslint-disable-next-line no-useless-constructor
    constructor(private db: IDatabase<any>) {
    }

    async getLocalSetting(key: string): Promise<string> {
        const row = await this.db.one('SELECT value FROM localsettings WHERE key=$1', [key])
        return row.value
    }

    async getKeyGrip(): Promise<KeyGrip> {
        const rows = await this.db.any('SELECT value FROM localsettings WHERE key LIKE $1 ORDER BY key DESC', ['KEYGRIP%'])
        if (rows.length === 0) {
            throw Error('No keys to create KeyGrip')
        }
        console.log(rows)
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

    async getEmailFilterMatch(email: string): Promise<boolean|null> {
        // verbose version of matchend that postgres doesn't have
        const rows = await this.db.any('SELECT * from emailfilter WHERE substring(reverse($1),0,length(match)+1)=reverse(match) ORDER BY forder', [email])
        for (const r of rows) {
            return r.drop
        }
        return null // no vote
    }
}
