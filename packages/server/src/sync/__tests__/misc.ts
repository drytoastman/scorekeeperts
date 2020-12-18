import { pgp } from 'scdb'
import { doSync, resetData, testids, verifyObjectsSame, verifyObjectsAre, with2DB, DB1, DB2 } from './helpers'

beforeEach(async () => {
    await resetData([DB1, DB2])
})

afterAll(() => {
    pgp.end()
})

describe('testing misc', () => {

    test('account delete reinsertion regression', async () => {
        // Regression test for bug where delete of payment account was being reinserted by a remote sync """
        await with2DB(DB1, DB2, testids.series, async (task1, task2) => {
            // Insert remote
            await task2.none("INSERT INTO paymentaccounts (accountid, name, type, attr) VALUES ($1, 'accountname', 'paypal', '{}')", [testids.accountid])
            await task2.none("INSERT INTO paymentitems    (itemid, name, price, currency) VALUES ($1, 'itemname', 100, 'USD')", [testids.itemid])

            await doSync(DB1)
            await verifyObjectsSame([task1, task2], 'SELECT * FROM paymentaccounts WHERE accountid=$1',  testids.accountid)
            await verifyObjectsSame([task1, task2], 'SELECT * FROM paymentitems WHERE itemid=$1', testids.itemid)

            // Delete remote
            await task2.none('DELETE FROM paymentitems WHERE itemid=$1', [testids.itemid])
            await task2.none('DELETE FROM paymentaccounts WHERE accountid=$1', [testids.accountid])

            await doSync(DB1)
            await verifyObjectsAre([task1, task2], 'SELECT * FROM paymentaccounts WHERE accountid=$1',  testids.accountid, null)
            await verifyObjectsAre([task1, task2], 'SELECT * FROM paymentitems WHERE itemid=$1', testids.itemid, null)
        })
    })

    test('double sync should fault', async () => {
        try {
            // use allSettled so the both finish before moving on
            for (const p of await Promise.allSettled([doSync(DB1), doSync(DB1)])) {
                if (p.status === 'rejected') throw p.reason
            }
            throw new Error('double sync did not throw error')
        } catch (error) {
            expect(error.message).toMatch(/Request to sync but there is already an active sync ocurring on the database/)
        }
    })
})
