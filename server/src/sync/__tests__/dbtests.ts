import { pgp } from '@/db'
import { asyncwait } from '../constants'
import { doSync, getTestDB, resetData, verifyAccount } from './helpers'

const DB1 = 7001
const DB2 = 7002

beforeEach(async () => {
    console.log('before each')
    await resetData([DB1, DB2])
})

afterAll(() => {
    pgp.end()
})

describe('testing simple', () => {
    test('simepl test', async () => {
        console.log('starting test now')
        const rows = await getTestDB(DB1).any('SELECT * FROM drivers')
        for (const d of rows) {
            console.log(JSON.stringify(d))
        }

        const rows2 = await getTestDB(DB2).any('SELECT * FROM drivers')
        for (const d of rows2) {
            console.log(JSON.stringify(d))
        }
    })

    test('account delete reinsertion regression', async () => {
        // Regression test for bug where delete of payment account was being reinserted by a remote sync """
        const testaccountid = 'paypalid'
        const testitemid = '00000000-0000-0000-0000-000000000255'

        // Insert remote
        await getTestDB(DB2).tx(async tx => {
            await tx.none("INSERT INTO paymentaccounts (accountid, name, type, attr) VALUES ($1, 'accountname', 'paypal', '{}')", [testaccountid])
            await tx.none("INSERT INTO paymentitems    (itemid, accountid, name, price, currency) VALUES ($1, $2, 'itemname', 100, 'USD')", [testitemid, testaccountid])
        })
        await asyncwait(300)

        doSync(DB1)
        await verifyAccount([DB1, DB2], testaccountid, [['name', 'accountname'], ['type', 'paypal']])
        // verify_item(syncx, testitemid, (('accountid', testaccountid), ('name', 'itemname'), ('price', 100)))

        // Delete remote
        await getTestDB(DB2).tx(async tx => {
            await tx.none('DELETE FROM paymentitems WHERE accountid=$1', [testaccountid])
            await tx.none('DELETE FROM paymentaccounts WHERE accountid=$1', [testaccountid])
        })
        await asyncwait(300)

        doSync(DB1)
        // verify_account(syncx, testaccountid, None)
        // verify_item(syncx, testitemid, None)

    })
})
