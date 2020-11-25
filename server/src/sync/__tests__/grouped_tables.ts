import { v1 as uuidv1 } from 'uuid'

import { pgp } from '@/db'
import { DB1, DB2, doSync, resetData, testids, timingpause, verifyObjectsLike, with2DB } from './helpers'

beforeEach(async () => {
    await resetData([DB1, DB2])
})

afterAll(async () => {
    pgp.end()
})

describe('grouped tables', () => {
    test('runorder reorder', async () => {
        await with2DB(DB1, DB2, testids.series, async (task1, task2) => {
            const insert = 'INSERT INTO runorder (cars, eventid, course, rungroup) VALUES ($1::uuid[], $2, $3, $4)'
            const update = 'UPDATE runorder SET cars=$1::uuid[],modified=now() WHERE eventid=$2 and course=$3 and rungroup=$4'

            // Add a second run order and sync
            task1.none(update, [[testids.carid2], testids.eventid1, 1, 1])
            // now also allowed in another run group as its event depdendent and enforced by application
            task1.none(insert, [[testids.carid2], testids.eventid1, 1, 2])

            // make sure we can't add an invalid carid
            try {
                await task1.none(insert, [[uuidv1()], testids.eventid1, 2, 2])
                throw Error('runorder conflict did not throw error')
            } catch (error) {
                expect(error.message).toMatch(/Attempting to create a row with an unknown carid/)
            }

            // make sure we can't double a car
            try {
                await task1.none(insert, [[testids.carid2, testids.carid3, testids.carid2], testids.eventid1, 2, 2])
                throw Error('runorder duplicate did not throw error')
            } catch (error) {
                expect(error.message).toMatch(/You cannot add a car multiple times to the same rungroup/)
            }

            await doSync(DB1)
            // Simulate a runorder reorder
            task1.none(update, [[testids.carid2, testids.carid1], testids.eventid1, 1, 1])
            // Different reorder on B
            task1.none(update, [[testids.carid3, testids.carid2, testids.carid1], testids.eventid1, 1, 1])
            await doSync(DB1)
            await verifyObjectsLike([task1, task2], 'SELECT * FROM runorder WHERE eventid=$1 AND course=$2 AND rungroup=$3',
                                     [testids.eventid1, 1, 1], { cars: [testids.carid3, testids.carid2, testids.carid1] })
        })
    })

    test('classorder reorder', async () => {
        await with2DB(DB1, DB2, testids.series, async (task1, task2) => {
            const insert = 'INSERT INTO classorder (eventid, rungroup, classes, modified) VALUES ($1, $2, $3, now())'
            const update = 'UPDATE classorder SET classes=$1, modified=now() WHERE eventid=$2 AND rungroup=$3'

            // Add a second run order row and sync
            task1.none(insert, [testids.eventid1, 1, ['c3', 'c2', 'c1']])

            // can't add to another group in same event
            try {
                await task1.none(insert, [testids.eventid1, 2, ['c3', 'c4', 'c5']])
                throw Error('classorder conflict did not throw error')
            } catch (error) {
                expect(error.message).toMatch(/Class cannot be in multiple rungroups for the same event/)
            }

            // can't add if class doesn't exist
            try {
                await task1.none(insert, [testids.eventid1, 2, ['c6']])
                throw Error('classorder missing did not throw error')
            } catch (error) {
                expect(error.message).toMatch(/Attempting to create a row with an unknown class code/)
            }

            await doSync(DB1)
            // Simulate a classorder reorder
            task1.none(update, [['c2', 'c3', 'c1'], testids.eventid1, 1])
            await timingpause()
            // Different reorder on B
            task2.none(update, [['c1', 'c2', 'c3'], testids.eventid1, 1])
            await doSync(DB1)

            await verifyObjectsLike([task1, task2], 'SELECT * FROM classorder WHERE eventid=$1 AND rungroup=$2',
                                    [testids.eventid1, 1], { classes: ['c1', 'c2', 'c3'] })
        })
    })

    test('runorder move regression', async () => {
        // Regression test for issue with run groups already on main server and modifed onsite, also make it span insert/update
        await with2DB(DB1, DB2, testids.series, async (task1, task2) => {
            const insert = 'INSERT INTO runorder (eventid, course, rungroup, cars, modified) VALUES ($1, $2, $3, $4::uuid[], $5)'
            const relete = 'DELETE FROM runorder'
            const clear  = "DELETE FROM serieslog WHERE tablen='runorder'"

            // Insert local
            await task1.none(relete)
            await task1.none(clear)
            await task1.none(insert, [testids.eventid1, 1, 1, [testids.carid1, testids.carid3], '2019-08-18T22:29:26.928839'])
            await task1.none(insert, [testids.eventid1, 1, 2, [testids.carid2],                 '2019-08-18T20:08:32.992674'])

            // Insert remote
            await task2.none(relete)
            await task2.none(clear)
            await task2.none(insert, [testids.eventid1, 1, 1, [testids.carid1, testids.carid2, testids.carid3], '2019-08-14T02:14:51.742448'])

            await doSync(DB1)
            await verifyObjectsLike([task1, task2], 'SELECT * FROM runorder WHERE eventid=$1 AND course=$2 AND rungroup=$3',
                                     [testids.eventid1, 1, 1], { cars: [testids.carid1, testids.carid3] })
            await verifyObjectsLike([task1, task2], 'SELECT * FROM runorder WHERE eventid=$1 AND course=$2 AND rungroup=$3',
                                     [testids.eventid1, 1, 2], { cars: [testids.carid2] })
        })
    })

    test('classorder move versus group constraint', async () => {
        // test same runorder_move for classorder as well as multiple group constraint when changing
        await with2DB(DB1, DB2, testids.series, async (task1, task2) => {
            const insert = 'INSERT INTO classorder (eventid, rungroup, classes, modified) VALUES ($1, $2, $3, $4)'
            const celete = 'DELETE FROM classorder'

            // Add a second run order row and sync
            task1.none(celete)
            task1.none(insert, [testids.eventid1, 1, ['c1', 'c3'], '2019-08-18 22:29:26.928839'])
            task1.none(insert, [testids.eventid1, 2, ['c2'],       '2019-08-18 20:08:32.992674'])

            task2.none(celete)
            task2.none(insert, [testids.eventid1, 1, ['c1', 'c2', 'c3'], '2019-08-14 02:14:51.742448'])

            await doSync(DB1)
            await verifyObjectsLike([task1, task2], 'SELECT * FROM classorder WHERE eventid=$1 AND rungroup=$2',
                                    [testids.eventid1, 1], { classes: ['c1', 'c3'] })
            await verifyObjectsLike([task1, task2], 'SELECT * FROM classorder WHERE eventid=$1 AND rungroup=$2',
                                    [testids.eventid1, 2], { classes: ['c2'] })
        })
    })
})
