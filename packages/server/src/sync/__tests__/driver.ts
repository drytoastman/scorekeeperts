import { EPOCH, errString } from 'sctypes/util'
import { pgp } from 'scdb'
import { DB1, DB2, doSync, getTestDB, resetData, testids, timingpause, verifyObjectsAre, verifyObjectsLike, verifyUpdateLogChanges, with2DB } from './helpers'

beforeEach(async () => {
    await resetData([DB1, DB2])
})

afterAll(async () => {
    pgp.end()
})

describe('driver sync tests', () => {
    test.only('basic driver sync', async () => {
        // Dealing with the advanced merge on the driver table
        await with2DB(DB1, DB2, testids.series, async (task1, task2) => {

            const cruft1 = { driverid:'c2c32a70-f0fa-11e7-9c7f-5e155307955f', firstname: 'X' }
            const cruft2 = { driverid:'c2c32a70-f0fa-11e7-9c7f-5e155307955f', firstname: 'Y' }
            const expected = {
                firstname: 'newfirst',
                lastname: 'newlast',
                email: 'newemail',
                password: testids.password,
                created: EPOCH,
                attr: {
                    address: '123', zip: '98222'
                }
            } as any

            // Modify firstname and address on A
            await task1.none('UPDATE drivers SET firstname=$1,attr=$2:json,modified=now() where driverid=$3', ['newfirst', { address: '123' }, testids.driverid1])
            await timingpause()

            // Modify lastname and zip on B, insert some spurious log data that isn't relavant to us
            await task2.none('UPDATE drivers SET lastname=$1,attr=$2:json,modified=now() where driverid=$3', ['newlast', { zip: '98111' }, testids.driverid1])
            await task2.none('INSERT INTO publiclog (usern, app, tablen, action, otime, ltime, olddata, newdata) ' +
                             "VALUES ('x', 'y', 'drivers', 'I', now(), now(), '{}', $1:json)", [cruft1])
            await task2.none('INSERT INTO publiclog (usern, app, tablen, action, otime, ltime, olddata, newdata) ' +
                             "VALUES ('x', 'y', 'drivers', 'U', now(), now(), $1:json, $2:json)", [cruft1, cruft2])
            await task2.none('INSERT INTO publiclog (usern, app, tablen, action, otime, ltime, olddata, newdata) ' +
                             "VALUES ('x', 'y', 'drivers', 'D', now(), now(), $1:json, '{}')", [cruft2])
            await timingpause()

            // Modify email and zip on A
            await task1.none('UPDATE drivers SET email=$1,attr=$2:json,modified=now() where driverid=$3', ['newemail', { address: '123', zip: '98222' }, testids.driverid1])
            await doSync(DB1)

            await verifyUpdateLogChanges([task1, task2], 'drivers')
            await verifyObjectsLike([task1, task2], 'SELECT * FROM drivers WHERE driverid=$1',  testids.driverid1, expected)

            // Remove zip
            await task1.none('UPDATE drivers SET attr=$1:json,modified=now() where driverid=$2', [{ address: '123' }, testids.driverid1])
            await doSync(DB1)

            expected.attr.zip = undefined
            await verifyUpdateLogChanges([task1, task2], 'drivers')
            await verifyObjectsLike([task1, task2], 'SELECT * FROM drivers WHERE driverid=$1',  testids.driverid1, expected)

            //  Delete driver on remote
            await task2.none('DELETE FROM registered WHERE carid in (SELECT carid FROM cars WHERE driverid=$1)', [testids.driverid1])
            await task2.none("UPDATE runorder SET cars = (SELECT COALESCE(array_agg(el), '{}') FROM (SELECT unnest(cars) " +
                             'EXCEPT SELECT carid from cars WHERE driverid=$1) t(el)), modified=now()', [testids.driverid1])
            await task2.none('DELETE FROM runs WHERE carid in (SELECT carid FROM cars WHERE driverid=$1)', [testids.driverid1])
            await task2.none('DELETE FROM cars WHERE driverid=$1', [testids.driverid1])
            await task2.none('DELETE FROM drivers WHERE driverid=$1', [testids.driverid1])

            await doSync(DB1)
            await verifyUpdateLogChanges([task1, task2], 'drivers')
            await verifyObjectsAre([task1, task2], 'SELECT * FROM drivers WHERE driverid=$1',  testids.driverid1, null)
            await verifyObjectsAre([task1, task2], 'SELECT * FROM drivers WHERE driverid=$1',  cruft1.driverid, null)
        })
    })


    test('merged driver', async () => {
        // 'Merged' driver got reinserted, test that case here """
        // Insert a driver and car, try and move car without updating mod time
        await getTestDB(DB1).task(async task => {
            await task.none("INSERT INTO drivers (driverid, firstname, lastname, email, username) VALUES ($1, 'first', 'last', 'email', 'other')", [testids.newdriverid])
            await task.none("INSERT INTO cars (carid, driverid, classcode, indexcode, number, useclsmult, attr, modified) VALUES ($1, $2, 'c1', 'i1', 2, 'f', '{}', now())",
                        [testids.newcarid, testids.newdriverid])

            try {
                await task.none('UPDATE cars SET driverid=$1 WHERE driverid=$2', [testids.driverid1, testids.newdriverid])
                throw Error('Invalid update did not throw error')
            } catch (error) {
                expect(errString(error)).toMatch(/Updating without changing modification time/)
            }
        })
    })
})
