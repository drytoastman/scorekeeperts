import { IDatabase, IMain } from 'pg-promise'
import _ from 'lodash'

import { verifyDriverRelationship } from './helper'
import { PaymentAccount, PaymentItem, PaymentAccountSecret } from '@sctypes/payments'
import { UUID, validateObj } from '@sctypes/util'
import { Payment, PaymentValidator } from '@sctypes/register'
import { ItemMap } from '@sctypes/event'
import { TABLES } from '.'

export class PaymentsRepository {
    constructor(private db: IDatabase<any>, private pgp: IMain) {
    }

    async getPaymentAccounts(): Promise<PaymentAccount[]> {
        return this.db.any('SELECT * FROM paymentaccounts')
    }

    async getPaymentItems(): Promise<PaymentItem[]> {
        return this.db.query('SELECT * from paymentitems')
    }

    async updatePaymentItems(type: string, items: PaymentItem[]): Promise<PaymentItem[]> {
        if (type === 'insert') { return this.db.any(this.pgp.helpers.insert(items, TABLES.paymentitems) + ' RETURNING *') }
        if (type === 'update') { return this.db.any(this.pgp.helpers.update(items, TABLES.paymentitems) + ' WHERE v.itemid = t.itemid RETURNING *') }
        if (type === 'delete') {
            const rows = await this.db.any('SELECT DISTINCT e.name,e.date FROM itemeventmap m JOIN events e ON m.eventid=e.eventid ' +
                                           'WHERE m.itemid IN ($1:csv) ORDER BY e.date', [items.map(i => i.itemid)])
            if (rows.length > 0) {
                throw Error(`Items(s) still in use for events (${rows.map(r => r.name).join(', ')})`)
            }
            return this.db.any('DELETE from paymentitems WHERE itemid in ($1:csv) RETURNING itemid', items.map(i => i.itemid))
        }
        throw Error(`Unknown operation type ${JSON.stringify(type)}`)
    }

    async getItemMaps(): Promise<ItemMap[]> {
        return this.db.any('SELECT * FROM itemeventmap')
    }

    async updateItemMaps(type: string, eventid: UUID, maps: ItemMap[]): Promise<ItemMap[]> {
        if (type === 'insert') {
            return this.db.any(this.pgp.helpers.insert(maps, TABLES.itemeventmap) + ' RETURNING *')

        } else if (type === 'eventupdate') {
            await this.db.none(`DELETE FROM itemeventmap WHERE eventid=$1 ${maps.length > 0 ? 'AND itemid NOT IN ($2:csv)' : ''}`, [eventid, maps.map(m => m.itemid)])
            for (const itemmap of maps) {
                await this.db.any(this.pgp.helpers.insert([itemmap], TABLES.itemeventmap) +
                                ' ON CONFLICT (eventid, itemid) DO UPDATE SET ' +
                                this.pgp.helpers.sets(itemmap, TABLES.itemeventmap))
            }
            return this.db.any('SELECT * FROM itemeventmap WHERE eventid=$1', [eventid])
        }

        throw Error(`Unknown operation type for updateItemMaps ${JSON.stringify(type)}`)
    }

    async getPaymentAccount(accountid: string): Promise<PaymentAccount> {
        return this.db.one('SELECT * FROM paymentaccounts WHERE accountid=$1', [accountid])
    }

    async updatePaymentAccounts(type: string, accounts: PaymentAccount[]): Promise<PaymentAccount[]> {
        if (type === 'insert') { return this.db.any(this.pgp.helpers.insert(accounts, TABLES.paymentaccounts) + ' RETURNING *') }
        if (type === 'update') { return this.db.any(this.pgp.helpers.update(accounts, TABLES.paymentaccounts) + ' WHERE v.accountid = t.accountid RETURNING *') }
        if (type === 'delete') {
            const ids = accounts.map(a => a.accountid)
            const rows = await this.db.any('SELECT name FROM events WHERE accountid in ($1:csv) ORDER BY date', [ids])
            if (rows.length > 0) {
                throw Error(`Account(s) still in use for events (${rows.map(r => r.name).join(', ')})`)
            }
            return this.db.tx(t => {
                t.any('DELETE from paymentsecrets WHERE accountid in ($1:csv)', [ids])
                return t.any('DELETE from paymentaccounts WHERE accountid in ($1:csv) RETURNING accountid', [ids])
            })
        }
        throw Error(`Unknown operation type ${JSON.stringify(type)}`)
    }

    async getPaymentAccountSecret(accountid: string): Promise<PaymentAccountSecret> {
        return this.db.one('SELECT * FROM paymentsecrets WHERE accountid=$1', [accountid])
    }

    async updatePaymentAccountSecrets(type: string, secrets: PaymentAccountSecret[]): Promise<void> {
        if (type === 'insert') { await this.db.any(this.pgp.helpers.insert(secrets, TABLES.paymentsecrets)); return }
        if (type === 'update') { await this.db.any(this.pgp.helpers.update(secrets, TABLES.paymentsecrets) + ' WHERE v.accountid = t.accountid RETURNING *'); return }
        if (type === 'delete') { await this.db.any('DELETE from paymentsecrets WHERE accountid in ($1:csv)', secrets.map(s => s.accountid)); return }
        throw Error(`Unknown operation type ${JSON.stringify(type)}`)
    }

    /* Upserts */
    async upsertPaymentAccount(account: PaymentAccount): Promise<null> {
        return this.db.none('INSERT INTO paymentaccounts (accountid, name, type, attr) VALUES ($(accountid), $(name), $(type), $(attr)) ' +
                            'ON CONFLICT (accountid) DO UPDATE SET name=$(name), type=$(type), attr=$(attr), modified=now()', account)
    }

    async upsertPaymentSecret(secret: PaymentAccountSecret): Promise<null> {
        return this.db.none('INSERT INTO paymentsecrets (accountid, secret, attr) VALUES ($(accountid), $(secret), $(attr)) ' +
                            'ON CONFLICT (accountid) DO UPDATE SET secret=$(secret), attr=$(attr), modified=now()', secret)
    }
    /***********/

    async getPaymentsbyAccountId(accountid: UUID): Promise<Payment[]> {
        return this.db.any('SELECT * FROM payments WHERE attr->>\'accountid\'=$1', [accountid])
    }

    async getPaymentsbyDriverId(driverid: UUID): Promise<Payment[]> {
        return this.db.any('SELECT * FROM payments WHERE driverid=$1', [driverid])
    }

    async getAllPayments(eventid?: UUID): Promise<Payment[]> {
        return this.db.any('SELECT * FROM payments ' + (eventid ? 'WHERE eventid=$1 ' : ''), [eventid])
    }

    async updatePayments(type: string, payments: Payment[], driverid?: UUID): Promise<Payment[]> {
        if (driverid) {
            await verifyDriverRelationship(this.db, payments.map(p => p.carid).filter(v => v), driverid)
        }
        if (type !== 'delete') {
            payments.forEach(p => validateObj(p, PaymentValidator))
        }

        if (type === 'insert') { return this.db.any(this.pgp.helpers.insert(payments, TABLES.payments) + ' RETURNING *') }
        if (type === 'update') { return this.db.any(this.pgp.helpers.update(payments, TABLES.payments) + ' WHERE v.payid = t.payid RETURNING *') }
        if (type === 'delete') { return this.db.any('DELETE from payments WHERE payid in ($1:csv)', payments.map(p => p.payid)) }

        throw Error(`Unknown operation type ${JSON.stringify(type)}`)
    }
}
