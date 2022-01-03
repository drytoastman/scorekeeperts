import { pgp } from 'scdb'
import { errString } from 'sctypes'
import { doSync, resetData, testids, verifyObjectsSame, verifyObjectsAre, verifyObjectsLike, with2DB, DB1, DB2 } from './helpers'

beforeEach(async () => {
    await resetData([DB1, DB2])
})

afterAll(() => {
    pgp.end()
})

describe('testing misc', () => {

    test('run key add, delete then add again, latest add should take precedence over earlier delete', async () => {
        // Regression test for bug where an old delete of a run that was synced would keep deleting new runs being added with the same key
        await with2DB(DB1, DB2, testids.series, async (task1, task2) => {
            const therun = { eventid: testids.eventid1, carid: testids.carid1, course: 1, rungroup: 1, run: 1, raw: 1.0, cones: 0, gates: 0, status: 'OK', attr: {}}
            const select = 'SELECT * FROM runs WHERE eventid=$(eventid1) AND carid=$(carid1) AND course=1 AND rungroup=1 AND run=1'

            await verifyObjectsLike([task1, task2], select, testids, therun)

            // DELETE
            await task1.none('DELETE FROM runs WHERE eventid=$(eventid1) AND carid=$(carid1) AND course=1 AND rungroup=1 AND run=1', testids)
            await doSync(DB1)
            await verifyObjectsLike([task1, task2], select, testids, null)

            // REINSERT
            await task1.none("INSERT INTO runs (eventid, carid, course, rungroup, run, raw, status, attr) VALUES ($(eventid1), $(carid1), 1, 1, 1, 1.0, 'OK', '{}')", testids)
            await doSync(DB1)
            await verifyObjectsLike([task1, task2], select, testids, therun)
        })
    })


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

    test('registration change and back again on remote', async () => {
        // Regression test for bug where a registered is modified and then back again, new modified value but same data so trigger filters """
        await with2DB(DB1, DB2, testids.series, async (task1, task2) => {
            const data = [testids.eventid1, testids.carid3, '', 0, '2021-03-11 05:12:27.388459']
            // Insert local
            await task1.none('INSERT INTO registered (eventid, carid, session, rorder, modified) VALUES ($1, $2, $3, $4, $5)', data)
            // Insert remote
            data[4] = '2021-03-11 17:13:03.802123'
            await task2.none('INSERT INTO registered (eventid, carid, session, rorder, modified) VALUES ($1, $2, $3, $4, $5)', data)

            await doSync(DB1)
            await verifyObjectsSame([task1, task2], 'SELECT * FROM registered WHERE eventid=$1',  testids.eventid1)
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
            expect(errString(error)).toMatch(/Request to sync but there is already an active sync ocurring on the database/)
        }
    })
})
