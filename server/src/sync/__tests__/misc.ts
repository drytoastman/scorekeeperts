import { pgp } from '@/db'
import { asyncwait } from '../constants'
import { doSync, resetData, testids, verifyObjectsSame, verifyObjectsAre, with2DB, DB1, DB2 } from './helpers'

beforeEach(async () => {
    await resetData([DB1, DB2])
})

afterAll(() => {
    pgp.end()
})

describe('testing utility', () => {

    test('account delete reinsertion regression', async () => {
        // Regression test for bug where delete of payment account was being reinserted by a remote sync """
        await with2DB(DB1, DB2, testids.series, async (task1, task2) => {
            // Insert remote
            await task2.none("INSERT INTO paymentaccounts (accountid, name, type, attr) VALUES ($1, 'accountname', 'paypal', '{}')", [testids.accountid])
            await task2.none("INSERT INTO paymentitems    (itemid, name, price, currency) VALUES ($1, 'itemname', 100, 'USD')", [testids.itemid])
            await asyncwait(300)

            await doSync(DB1)
            await verifyObjectsSame([task1, task2], 'SELECT * FROM paymentaccounts WHERE accountid=$1',  testids.accountid)
            await verifyObjectsSame([task1, task2], 'SELECT * FROM paymentitems WHERE itemid=$1', testids.itemid)

            // Delete remote
            await task2.none('DELETE FROM paymentitems WHERE itemid=$1', [testids.itemid])
            await task2.none('DELETE FROM paymentaccounts WHERE accountid=$1', [testids.accountid])
            await asyncwait(300)

            await doSync(DB1)
            await verifyObjectsAre([task1, task2], 'SELECT * FROM paymentaccounts WHERE accountid=$1',  testids.accountid, null)
            await verifyObjectsAre([task1, task2], 'SELECT * FROM paymentitems WHERE itemid=$1', testids.itemid, null)
        })
    })
})
