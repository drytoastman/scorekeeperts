import { PaymentAccount, PaymentItem } from '@common/lib'
import { IDatabase } from 'pg-promise'
import _ from 'lodash'

export class PaymentsRepository {
    // eslint-disable-next-line no-useless-constructor
    constructor(private db: IDatabase<any>) {
    }

    async getPaymentAccounts(): Promise<PaymentAccount[]> {
        return this.db.any('SELECT * FROM paymentaccounts')
    }

    async getPaymentItems(): Promise<PaymentItem[]> {
        return this.db.query('SELECT * from paymentitems')
    }

    async getPaymentSecret(accountid: string): Promise<String> {
        return (await this.db.one('SELECT secret FROM paymentsecrets WHERE accountid=$1', [accountid])).secret
    }
}
