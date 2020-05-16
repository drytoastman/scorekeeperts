import { IDatabase, ColumnSet, IMain } from 'pg-promise'
import _ from 'lodash'
import { v1 as uuidv1 } from 'uuid'

import { PaymentAccount, PaymentItem, UUID, Payment } from '@common/lib'
import { verifyDriverRelationship } from './helper'

let paymentcols: ColumnSet|undefined

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

    async getPaymentAccountSecret(accountid: string): Promise<string> {
        return (await this.db.one('SELECT secret FROM paymentsecrets WHERE accountid=$1', [accountid])).secret
    }

    async getPaymentsbyDriverId(driverid: UUID): Promise<Payment[]> {
        return this.db.query('SELECT p.* FROM payments AS p JOIN cars c ON p.carid=c.carid WHERE c.driverid=$1', [driverid])
    }

    async updatePayments(type: string, payments: Payment[], driverid: UUID): Promise<Payment[]> {
        verifyDriverRelationship(this.db, payments.map(p => p.carid), driverid)

        if (type === 'insert') {
            payments.forEach(p => { p.payid = uuidv1() })
            return this.db.any(this.pgp.helpers.insert(payments, paymentcols) + ' RETURNING *')
        }

        throw Error(`Unknown operation type ${JSON.stringify(type)}`)
    }
}
