import { v1 as uuidv1 } from 'uuid'
import { pgp } from 'scdb'
import { runSyncOnce } from '../process'
import { ACTIVE } from '../mergeserver'
import { seriesLockId } from '../constants'
import { DB1, DB2, getTestDB, testids, timingpause } from './helpers'

const series1 = 'conctest1'
const series2 = 'conctest2'

const ids1 = {
    ...testids,
    series: series1,
    seriespassword: series1,
    driverid1: '00000000-0000-0000-0000-000000000101',
    carid1:    '00000000-0000-0000-0000-000000000102',
    eventid1:  '00000000-0000-0000-0000-000000000110'
}

const ids2 = {
    ...testids,
    series: series2,
    seriespassword: series2,
    driverid1: '00000000-0000-0000-0000-000000000201',
    carid1:    '00000000-0000-0000-0000-000000000202',
    eventid1:  '00000000-0000-0000-0000-000000000210'
}

const LOCALID = '00000000-0000-0000-0000-000000000000'

// Drops all test schemas, clears public tables, re-inserts local merge server
const CLEAN_DB = `
DROP SCHEMA IF EXISTS testseries CASCADE;
DROP SCHEMA IF EXISTS ${series1} CASCADE;
DROP SCHEMA IF EXISTS ${series2} CASCADE;
DELETE FROM weekendmembers;
DELETE FROM drivers;
DELETE FROM mergeservers;
DELETE FROM publiclog;
INSERT INTO mergeservers(serverid, hostname, address, ctimeout) VALUES ('${LOCALID}', 'localhost', '127.0.0.1', 10);
`

function setupSeries(ids: typeof ids1) {
    return `
SELECT verify_user('${ids.series}', '${ids.seriespassword}');
SELECT verify_series('${ids.series}');

SET search_path='${ids.series}','public';

INSERT INTO indexlist (indexcode, descrip, value) VALUES ('', '', 1.000);
INSERT INTO classlist (classcode, descrip, indexcode, caridxrestrict, classmultiplier, carindexed, usecarflag, eventtrophy, champtrophy, secondruns, countedruns, modified)
    VALUES ('c1', '', '', '', 1.0, 't', 'f', 't', 't', 'f', 0, now());

INSERT INTO drivers (driverid, firstname, lastname, email, username, password, created)
    VALUES ('${ids.driverid1}', 'first_${ids.series}', 'last_${ids.series}', '${ids.series}@test', '${ids.series}', '${ids.password}', '1970-01-01T00:00:00');
INSERT INTO cars (carid, driverid, classcode, indexcode, number, useclsmult, attr, modified)
    VALUES ('${ids.carid1}', '${ids.driverid1}', 'c1', '', 1, 'f', '{}', now());
INSERT INTO events (eventid, name, date, regclosed, attr)
    VALUES ('${ids.eventid1}', '${ids.series}_event', now(), now(), '{}');
INSERT INTO runorder (eventid, course, rungroup, cars)
    VALUES ('${ids.eventid1}', 1, 1, '{${ids.carid1}}');
INSERT INTO runs (eventid, carid, course, rungroup, run, raw, status, attr)
    VALUES ('${ids.eventid1}', '${ids.carid1}', 1, 1, 1, 10.0, 'OK', '{}');
`
}

const ims = 'INSERT INTO mergeservers(serverid, hostname, address, ctimeout, hoststate) VALUES ($1, $2, $3, $4, $5)'

async function resetConcurrentData() {
    const serverids = [uuidv1(), uuidv1()]
    const ports = [DB1, DB2]

    // Clean both DBs completely first (schemas must drop before drivers due to FK)
    for (const port of ports) {
        await getTestDB(port).any(CLEAN_DB)
    }

    // Set up series data on DB1, empty schemas on DB2
    const db1 = getTestDB(DB1)
    await db1.any(setupSeries(ids1))
    await db1.any(setupSeries(ids2))

    const db2 = getTestDB(DB2)
    await db2.any(`SELECT verify_user('${series1}', '${series1}'); SELECT verify_series('${series1}');`)
    await db2.any(`SELECT verify_user('${series2}', '${series2}'); SELECT verify_series('${series2}');`)

    // Set up merge server entries pointing at the other DB
    for (const port of ports) {
        const d = getTestDB(port)
        const other = ports.find(p => p !== port)!
        await d.none(ims, [serverids[ports.indexOf(other)], `server${other}`, `127.0.0.1:${other}`, 5, ACTIVE])
    }

    // Initial sync to get both DBs in the same state
    await db1.none("UPDATE mergeservers SET lastcheck='epoch', nextcheck='epoch'")
    await runSyncOnce(db1)
}

async function doSyncForSeries(port: number, series: string) {
    const db = getTestDB(port)
    await db.none("UPDATE mergeservers SET lastcheck='epoch', nextcheck='epoch'")
    await runSyncOnce(db)
    // Verify no errors for the specified series
    for (const row of await db.many('select mergestate->$1 as state from mergeservers', [series])) {
        if (row.state) {
            expect(row.state.error).toBeUndefined()
        }
    }
}

beforeEach(async () => {
    await resetConcurrentData()
}, 30000)

afterAll(async () => {
    // Clean up our test schemas so other test files start fresh
    for (const port of [DB1, DB2]) {
        const d = getTestDB(port)
        await d.any(`DROP SCHEMA IF EXISTS ${series1} CASCADE`)
        await d.any(`DROP SCHEMA IF EXISTS ${series2} CASCADE`)
    }
    pgp.end()
})

describe('concurrent series sync', () => {

    test('seriesLockId produces different IDs for different series', () => {
        const id1 = seriesLockId(series1)
        const id2 = seriesLockId(series2)
        expect(id1).not.toEqual(id2)
        expect(id1).toBeGreaterThan(0)
        expect(id2).toBeGreaterThan(0)
    })

    test('two series with only run changes sync without global lock contention', async () => {
        const db1 = getTestDB(DB1)
        const db2 = getTestDB(DB2)

        // Modify runs in series1 on DB1
        await db1.none(`SET search_path='${series1}','public'`)
        await db1.none(`UPDATE runs SET raw=11.111, modified=now() WHERE eventid='${ids1.eventid1}' AND run=1`)

        await timingpause()

        // Modify runs in series2 on DB2
        await db2.none(`SET search_path='${series2}','public'`)
        await db2.none(`UPDATE runs SET raw=22.222, modified=now() WHERE eventid='${ids2.eventid1}' AND run=1`)

        // Sync from DB1 — both series should merge without issues
        await doSyncForSeries(DB1, series1)

        // Verify series1 run synced to DB2
        await db2.none(`SET search_path='${series1}','public'`)
        const run1 = await db2.one(`SELECT raw FROM runs WHERE eventid='${ids1.eventid1}' AND run=1`)
        expect(parseFloat(run1.raw)).toBeCloseTo(11.111)

        // Verify series2 run synced to DB1
        await db1.none(`SET search_path='${series2}','public'`)
        const run2 = await db1.one(`SELECT raw FROM runs WHERE eventid='${ids2.eventid1}' AND run=1`)
        expect(parseFloat(run2.raw)).toBeCloseTo(22.222)
    })

    test('driver change in one series does not block run sync in another', async () => {
        const db1 = getTestDB(DB1)
        const db2 = getTestDB(DB2)

        // Modify a driver (public table) via series1 on DB1
        await db1.none(`SET search_path='${series1}','public'`)
        await db1.none(`UPDATE drivers SET firstname='modified_driver', modified=now() WHERE driverid='${ids1.driverid1}'`)

        await timingpause()

        // Modify only runs in series2 on DB2 (no public table changes)
        await db2.none(`SET search_path='${series2}','public'`)
        await db2.none(`UPDATE runs SET raw=33.333, modified=now() WHERE eventid='${ids2.eventid1}' AND run=1`)

        // Sync — series2 should only need per-series lock, series1 needs global + per-series
        await doSyncForSeries(DB1, series1)

        // Verify driver change synced
        await db2.none(`SET search_path='${series1}','public'`)
        const driver = await db2.one(`SELECT firstname FROM drivers WHERE driverid='${ids1.driverid1}'`)
        expect(driver.firstname).toEqual('modified_driver')

        // Verify run change synced
        await db1.none(`SET search_path='${series2}','public'`)
        const run = await db1.one(`SELECT raw FROM runs WHERE eventid='${ids2.eventid1}' AND run=1`)
        expect(parseFloat(run.raw)).toBeCloseTo(33.333)
    })

    test('new driver with car and runs syncs correctly across series boundary', async () => {
        const db1 = getTestDB(DB1)
        const newDriverId = '00000000-0000-0000-0000-000000000301'
        const newCarId    = '00000000-0000-0000-0000-000000000302'

        // Add a new driver + car + run in series1 on DB1
        await db1.none(`SET search_path='${series1}','public'`)
        await db1.none(`INSERT INTO drivers (driverid, firstname, lastname, email, username, password, created)
            VALUES ('${newDriverId}', 'new', 'driver', 'new@test', 'newuser', '${ids1.password}', '1970-01-01T00:00:00')`)
        await db1.none(`INSERT INTO cars (carid, driverid, classcode, indexcode, number, useclsmult, attr, modified)
            VALUES ('${newCarId}', '${newDriverId}', 'c1', '', 2, 'f', '{}', now())`)
        await db1.none(`INSERT INTO registered (eventid, carid, session, modified) VALUES ('${ids1.eventid1}', '${newCarId}', '', now())`)
        await db1.none(`INSERT INTO runs (eventid, carid, course, rungroup, run, raw, status, attr)
            VALUES ('${ids1.eventid1}', '${newCarId}', 1, 1, 1, 55.555, 'OK', '{}')`)

        await doSyncForSeries(DB1, series1)

        // Verify new driver + car + run arrived on DB2
        const db2 = getTestDB(DB2)
        const driver = await db2.oneOrNone(`SELECT * FROM drivers WHERE driverid='${newDriverId}'`)
        expect(driver).not.toBeNull()
        expect(driver.firstname).toEqual('new')

        await db2.none(`SET search_path='${series1}','public'`)
        const car = await db2.oneOrNone(`SELECT * FROM cars WHERE carid='${newCarId}'`)
        expect(car).not.toBeNull()

        const run = await db2.oneOrNone(`SELECT * FROM runs WHERE carid='${newCarId}' AND run=1`)
        expect(run).not.toBeNull()
        expect(parseFloat(run.raw)).toBeCloseTo(55.555)
    })
})
