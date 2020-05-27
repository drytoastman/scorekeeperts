import { IDatabase, ColumnSet, IMain } from 'pg-promise'
import _ from 'lodash'
import { v1 as uuidv1 } from 'uuid'

import { PaymentAccount, PaymentItem, UUID, Payment, PaymentAccountSecret } from '@common/lib'
import { verifyDriverRelationship } from './helper'
import { CatalogQueryText } from 'square-connect'

let paymentcols: ColumnSet|undefined
let secretcols: ColumnSet|undefined
let accountcols: ColumnSet|undefined

export class PaymentsRepository {
    // eslint-disable-next-line no-useless-constructor
    constructor(private db: IDatabase<any>, private pgp: IMain) {
        if (paymentcols === undefined) {
            paymentcols = new pgp.helpers.ColumnSet([
                { name: 'payid',    cnd: true, cast: 'uuid' },
                { name: 'eventid',  cast: 'uuid' },
                { name: 'carid',    cast: 'uuid' },
                { name: 'session' },
                { name: 'refid',    def: '' },
                { name: 'txtype' },
                { name: 'txid' },
                { name: 'txtime',   cast: 'timestamp' },
                { name: 'itemname' },
                { name: 'amount' },
                { name: 'modified', cast: 'timestamp', mod: ':raw', init: (): any => { return 'now()' } }
            ], { table: 'payments' })
        }

        if (accountcols === undefined) {
            accountcols = new pgp.helpers.ColumnSet([
                { name: 'accountid', cnd: true },
                { name: 'name' },
                { name: 'type' },
                { name: 'attr', cast: 'json' },
                { name: 'modified', cast: 'timestamp', mod: ':raw', init: (): any => { return 'now()' } }
            ], { table: 'paymentaccounts' })
        }

        if (secretcols === undefined) {
            secretcols = new pgp.helpers.ColumnSet([
                { name: 'accountid', cnd: true },
                { name: 'secret' },
                { name: 'attr', cast: 'json' },
                { name: 'modified', cast: 'timestamp', mod: ':raw', init: (): any => { return 'now()' } }
            ], { table: 'paymentsecrets' })
        }
    }

    private async localCacheGet(key: string): Promise<string> {
        return this.db.one('SELECT data FROM localcache WHERE name=$1', key).then(r => { return r.data })
    }

    async getSquareApplicationId(): Promise<string> {
        return this.localCacheGet('SQ_APPLICATION_ID')
    }

    async getSquareApplicationMode(): Promise<string> {
        return this.localCacheGet('SQ_APPLICATION_MODE')
    }

    async getSquareApplicationSecret(): Promise<string> {
        return this.localCacheGet('SQ_APPLICATION_SECRET')
    }

    async getPaymentAccounts(): Promise<PaymentAccount[]> {
        return this.db.any('SELECT * FROM paymentaccounts')
    }

    async getPaymentItems(): Promise<PaymentItem[]> {
        return this.db.query('SELECT * from paymentitems')
    }

    async getPaymentAccount(accountid: string): Promise<PaymentAccount> {
        return this.db.one('SELECT * FROM paymentaccounts WHERE accountid=$1', [accountid])
    }

    async getPaymentAccountSecret(accountid: string): Promise<PaymentAccountSecret> {
        return this.db.one('SELECT * FROM paymentsecrets WHERE accountid=$1', [accountid])
    }

    async upsertPaymentAccount(account: PaymentAccount): Promise<null> {
        return this.db.none('INSERT INTO paymentaccounts (accountid, name, type, attr) VALUES ($(accountid), $(name), $(type), $(attr)) ' +
                            'ON CONFLICT (accountid) DO UPDATE SET name=$(name), type=$(type), attr=$(attr), modified=now()', account)
    }

    async upsertPaymentSecret(secret: PaymentAccountSecret): Promise<null> {
        return this.db.none('INSERT INTO paymentsecrets (accountid, secret, attr) VALUES ($(accountid), $(secret), $(attr)) ' +
                            'ON CONFLICT (accountid) DO UPDATE SET secret=$(secret), attr=$(attr), modified=now()', secret)
    }

    async updatePaymentAccountSecret(secret: PaymentAccountSecret): Promise<void> {
        console.log(this.pgp.helpers.update(secret, secretcols) + ' WHERE accountid=$1')
        await this.db.none(this.pgp.helpers.update(secret, secretcols) + ' WHERE accountid=$1', [secret.accountid])
    }

    async getPaymentsbyDriverId(driverid: UUID): Promise<Payment[]> {
        return this.db.query('SELECT p.* FROM payments AS p JOIN cars c ON p.carid=c.carid WHERE c.driverid=$1', [driverid])
    }

    async updatePayments(type: string, payments: Payment[], driverid: UUID): Promise<Payment[]> {
        await verifyDriverRelationship(this.db, payments.map(p => p.carid), driverid)

        if (type === 'insert') {
            payments.forEach(p => { p.payid = uuidv1() })
            return this.db.any(this.pgp.helpers.insert(payments, paymentcols) + ' RETURNING *')
        }

        throw Error(`Unknown operation type ${JSON.stringify(type)}`)
    }
}
