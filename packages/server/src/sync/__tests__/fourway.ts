import { pgp } from 'scdb'
import { DB1, DB2, DB3, DB4, doSync, resetData, testids, verifyObjectsLike, with4DB } from './helpers'

beforeEach(async () => {
    await resetData([DB1, DB2, DB3, DB4])
})

afterAll(async () => {
    pgp.end()
})

describe('4 way syncing', () => {
    test('modifications on different machines at same time', async () => {

        await with4DB(DB1, DB2, DB3, DB4, testids.series, async (task1, task2, task3, task4) => {
            // Modify firstname and address on A, sync A to B
            await task1.none('UPDATE drivers SET firstname=$1,attr=$2,modified=now() where driverid=$3', ['newfirst', { address: '123' }, testids.driverid1])
            await doSync(DB1, [DB2])

            // Modify lastname and zip (clear address) on B, sync B to C
            await task2.none('UPDATE drivers SET lastname=$1,attr=$2,modified=now() where driverid=$3', ['newlast', { zip: '98111' }, testids.driverid1])
            await doSync(DB2, [DB3])

            // Modify email and zip on C, sync C to D
            await task3.none('UPDATE drivers SET email=$1,attr=$2,modified=now() where driverid=$3', ['newemail', {  city: 'nowhere', zip: '98222' }, testids.driverid1])
            await doSync(DB3, [DB4])

            // Modify car on D, sync A to D
            await task4.none('UPDATE cars SET number=$1,modified=now() where carid=$2', [2, testids.carid1])
            await doSync(DB1, [DB4])

            // Car is equals on A and D at this point
            await verifyObjectsLike([task1, task4], 'SELECT * FROM cars WHERE carid=$1', [testids.carid1], { number: 2 })
            // Driver should be equal on all
            await verifyObjectsLike([task1, task2, task3, task4], 'SELECT * from drivers WHERE driverid=$1', [testids.driverid1], {
                firstname: 'newfirst',
                lastname: 'newlast',
                email: 'newemail',
                attr: {
                    address: undefined,
                    city: 'nowhere',
                    zip: '98222'
                }
            })
        })
    })
})
