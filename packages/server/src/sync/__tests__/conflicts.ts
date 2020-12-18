import { pgp } from 'scdb'
import { DB1, DB2, doSync, resetData, testids, timingpause, verifyObjectsLike, with2DB } from './helpers'

beforeEach(async () => {
    await resetData([DB1, DB2])
})

afterAll(async () => {
    pgp.end()
})

describe('sync conflicts', () => {
    test('delete driver on one db while linking to a car on the other, should undelete', async () => {
        // Insert remote
        await with2DB(DB1, DB2, testids.series, async (task1, task2) => {
            const expected = { firstname: 'first', lastname: 'last', email: 'email' }
            task2.none("INSERT INTO drivers (driverid, firstname, lastname, email, username) VALUES ($1, 'first', 'last', 'email', 'other')", [testids.newdriverid])
            await doSync(DB1)

            await verifyObjectsLike([task1, task2], 'SELECT * FROM drivers WHERE driverid=$1',  testids.driverid1, expected)

            task1.none('DELETE FROM drivers WHERE driverid=$1', [testids.newdriverid])
            await timingpause()
            task2.none("INSERT INTO cars (carid, driverid, classcode, indexcode, number, useclsmult, attr, modified) VALUES ($1, $2, 'c1', 'i1', 2, 'f', '{}', now())",
                        [testids.newcarid, testids.newdriverid])
            await doSync(DB1)

            await verifyObjectsLike([task1, task2], 'SELECT * FROM drivers WHERE driverid=$1',  testids.newdriverid, expected)
            await verifyObjectsLike([task1, task2], 'SELECT * FROM cars WHERE carid=$1',  testids.newcarid, { classcode: 'c1' })
        })
    })

    test('updating a key column that references another deleted row', async () => {
        // Insert remote
        await with2DB(DB1, DB2, testids.series, async (task1, task2) => {
            task2.none("INSERT INTO indexlist (indexcode, descrip, value) VALUES ('i2', '', 0.999)")
            task2.none("INSERT INTO cars (carid, driverid, classcode, indexcode, number, useclsmult, attr, modified) VALUES ($1, $2, 'c1', 'i1', 2, 'f', '{}', now())",
                        [testids.newcarid, testids.driverid1])

            await doSync(DB1)
            await verifyObjectsLike([task1, task2], 'SELECT * FROM cars WHERE carid=$1',  testids.newcarid, { classcode: 'c1' })

            task1.none("DELETE FROM indexlist WHERE indexcode='i2'")
            task2.none("UPDATE cars SET indexcode='i2',modified=now() WHERE carid=$1", [testids.newcarid])

            await doSync(DB1)
            await verifyObjectsLike([task1, task2], 'SELECT * FROM cars WHERE carid=$1',  testids.newcarid, { classcode: 'c1' })
            await verifyObjectsLike([task1, task2], 'SELECT * FROM indexlist WHERE indexcode=$1', 'i2', { value: 0.999 })
        })
    })
})
