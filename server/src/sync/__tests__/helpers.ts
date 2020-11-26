import { diff as odiff } from 'deep-object-diff'
import _ from 'lodash'
import { v1 as uuidv1 } from 'uuid'

import { ScorekeeperProtocol, pgp, db as dbx, ScorekeeperProtocolDB } from '@/db'
import { runSyncOnce } from '../process'
import { ACTIVE } from '../mergeserver'
import { asyncwait } from '../constants'

export const testids = {
    driverid1: '00000000-0000-0000-0000-000000000001',
    password:  '$2b$12$g0z0JiGEuCudjhUF.5aawOlho3fpnPqKrV1EALTd1Cl/ThQQpFi2K',
    carid1:    '00000000-0000-0000-0000-000000000002',
    carid2:    '00000000-0000-0000-0000-000000000003',
    carid3:    '00000000-0000-0000-0000-000000000004',
    eventid1:  '00000000-0000-0000-0000-000000000010',
    accountid: 'paypalid',
    itemid:    '00000000-0000-0000-0000-000000000051',
    series:    'testseries',
    seriespassword: 'testseries',
    newdriverid: '00000000-0000-0000-0000-000000000142',
    newcarid:    '00000000-0000-0000-0000-000000000143'
}

export const DB1 = 7001
export const DB2 = 7002
export const DB3 = 7003
export const DB4 = 7004

export const RESET = `
DROP SCHEMA IF EXISTS $(series:raw) CASCADE;
DELETE FROM weekendmembers;
DELETE FROM drivers;
DELETE FROM mergeservers;
DELETE FROM publiclog;

SELECT verify_user($(series), $(seriespassword));
SELECT verify_series($(series));
INSERT INTO mergeservers(serverid, hostname, address, ctimeout) VALUES ('00000000-0000-0000-0000-000000000000', 'localhost', '127.0.0.1', 10);
`

const BASE = `
SET search_path=$(series),'public';

INSERT INTO indexlist (indexcode, descrip, value) VALUES ('',   '', 1.000);
INSERT INTO indexlist (indexcode, descrip, value) VALUES ('i1', '', 1.000);
INSERT INTO classlist (classcode, descrip, indexcode, caridxrestrict, classmultiplier, carindexed, usecarflag, eventtrophy, champtrophy, secondruns, countedruns, modified) VALUES ('c1', '', '', '', 1.0, 't', 'f', 't', 't', 'f', 0, now());
INSERT INTO classlist (classcode, descrip, indexcode, caridxrestrict, classmultiplier, carindexed, usecarflag, eventtrophy, champtrophy, secondruns, countedruns, modified) VALUES ('c2', '', '', '', 1.0, 't', 'f', 't', 't', 'f', 0, now());
INSERT INTO classlist (classcode, descrip, indexcode, caridxrestrict, classmultiplier, carindexed, usecarflag, eventtrophy, champtrophy, secondruns, countedruns, modified) VALUES ('c3', '', '', '', 1.0, 't', 'f', 't', 't', 'f', 0, now());
INSERT INTO classlist (classcode, descrip, indexcode, caridxrestrict, classmultiplier, carindexed, usecarflag, eventtrophy, champtrophy, secondruns, countedruns, modified) VALUES ('c4', '', '', '', 1.0, 't', 'f', 't', 't', 'f', 0, now());
INSERT INTO classlist (classcode, descrip, indexcode, caridxrestrict, classmultiplier, carindexed, usecarflag, eventtrophy, champtrophy, secondruns, countedruns, modified) VALUES ('c5', '', '', '', 1.0, 't', 'f', 't', 't', 'f', 0, now());

INSERT INTO drivers (driverid, firstname, lastname, email, username, password, created) VALUES ($(driverid1), 'first', 'last', 'email', 'username', $(password), '1970-01-01T00:00:00');
INSERT INTO cars    (carid, driverid, classcode, indexcode, number, useclsmult, attr, modified) VALUES ($(carid1), $(driverid1), 'c1', 'i1', 1, 'f', '{}', now());
INSERT INTO cars    (carid, driverid, classcode, indexcode, number, useclsmult, attr, modified) VALUES ($(carid2), $(driverid1), 'c1', 'i1', 1, 'f', '{}', now());
INSERT INTO cars    (carid, driverid, classcode, indexcode, number, useclsmult, attr, modified) VALUES ($(carid3), $(driverid1), 'c1', 'i1', 1, 'f', '{}', now());
INSERT INTO events (eventid, name, date, regclosed, attr) VALUES ($(eventid1), 'name', now(), now(), '{}');

INSERT INTO runorder (eventid, course, rungroup, cars) VALUES ($(eventid1), 1, 1, '{$(carid1:raw)}');

INSERT INTO runs (eventid, carid, course, rungroup, run, raw, status, attr) VALUES ($(eventid1), $(carid1), 1, 1, 1, 1.0, 'OK', '{}');
INSERT INTO runs (eventid, carid, course, rungroup, run, raw, status, attr) VALUES ($(eventid1), $(carid1), 1, 1, 2, 2.0, 'OK', '{}');
INSERT INTO runs (eventid, carid, course, rungroup, run, raw, status, attr) VALUES ($(eventid1), $(carid1), 1, 1, 3, 3.0, 'OK', '{}');
INSERT INTO runs (eventid, carid, course, rungroup, run, raw, status, attr) VALUES ($(eventid1), $(carid1), 1, 1, 4, 4.0, 'OK', '{}');
`

const ims = 'INSERT INTO mergeservers(serverid, hostname, address, ctimeout, hoststate) VALUES ($1, $2, $3, $4, $5)'

const dbmap = new Map<number, ScorekeeperProtocolDB>()
export function getTestDB(port: number): ScorekeeperProtocolDB {
    if (!dbmap.has(port)) {
        dbmap.set(port, pgp(Object.assign({}, dbx.$cn, { user: 'postgres', port: port })))
    }
    return dbmap.get(port) as ScorekeeperProtocolDB
}

export async function with2DB(port1: number, port2: number, series: string, execution: (task1: ScorekeeperProtocol, task2: ScorekeeperProtocol) => Promise<void>) {
    return getTestDB(port1).task(async task1 => {
        return getTestDB(port2).task(async task2 => {
            await task1.series.setSeries(series)
            await task2.series.setSeries(series)
            return await execution(task1, task2)
        })
    })
}

export async function with4DB(port1: number, port2: number, port3: number, port4: number, series: string,
                execution: (task1: ScorekeeperProtocol, task2: ScorekeeperProtocol, task3: ScorekeeperProtocol, task4: ScorekeeperProtocol) => Promise<void>) {
    return getTestDB(port1).task(async task1 => {
        return getTestDB(port2).task(async task2 => {
            return getTestDB(port3).task(async task3 => {
                return getTestDB(port4).task(async task4 => {
                    await task1.series.setSeries(series)
                    await task2.series.setSeries(series)
                    await task3.series.setSeries(series)
                    await task4.series.setSeries(series)
                    return await execution(task1, task2, task3, task4)
                })
            })
        })
    })
}

export async function timingpause() {
    // need change in mod times in database, add a 10ms break here
    return asyncwait(10)
}

function serverName(port: number) {
    return `server${port}`
}

export async function resetData(ports: number[]) {
    try {
        const serverids = ports.map(p1 => uuidv1())
        await Promise.all(ports.map(async (p1: number) => {
            const d = getTestDB(p1)
            await d.any(p1 === ports[0] ? RESET + BASE : RESET, testids)
            for (let ii = 0; ii < ports.length; ii++) {
                if (ports[ii] !== p1) {
                    await d.none(ims, [serverids[ii], serverName(ports[ii]), `127.0.0.1:${ports[ii]}`, 5, ACTIVE])
                }
            }
        }))
        await runSyncOnce(getTestDB(ports[0]))
    } catch (error) {
        console.error(error)
    }
}

export async function doSync(port: number, remotes?: number[]) {
    const db = getTestDB(port)
    if (remotes) {
        await db.none("UPDATE mergeservers SET lastcheck='epoch', nextcheck='epoch' WHERE hostname in ($1:csv)", [remotes.map(p => serverName(p))])
    } else {
        await db.none("UPDATE mergeservers SET lastcheck='epoch', nextcheck='epoch'")
    }
    await runSyncOnce(db)
    for (const row of await db.many('select mergestate->$1 as state from mergeservers', [testids.series])) {
        expect(row.state.error).toBeUndefined()
    }
}


/** Verification helpers **/

expect.extend({
    toBeAttrLike(received: any, like: any) {
        for (const key in like) {
            if (key === 'attr') continue
            if (!_.isEqual(received[key], like[key])) return { message: () => `${key}: ${received[key]} != ${like[key]}`, pass: false }
        }
        for (const key in like.attr) {
            if (received.attr[key] !== like.attr[key]) return { message: () => `attr.${key}: ${received.attr[key]} != ${like.attr[key]}`, pass: false }
        }
        return { message: () => `${received} same as ${like}`, pass: true }
    }
})

declare global {
    namespace jest {
        interface Matchers<R, T = {}> {
            toBeAttrLike<E = any>(expected: E): R;
        }
    }
}

/**
 * Object are the same on all databases, don't check actual value
 */
export async function verifyObjectsSame(tasks: ScorekeeperProtocol[], sql: string, args: any) {
    const base = await tasks[0].one(sql, args)
    for (let ii = 1; ii < tasks.length; ii++) {
        const other = await tasks[ii].oneOrNone(sql, args)
        expect(base).toEqual(other)
    }
}

/**
 * Object are the same on all databases and are equal to expected value
 */
export async function verifyObjectsAre(tasks: ScorekeeperProtocol[], sql: string, args: any, expected: any) {
    for (const t of tasks) {
        expect(await t.oneOrNone(sql, args)).toEqual(expected)
    }
}

/**
 * Objects on all databases have the given property values
 */
export async function verifyObjectsLike(tasks: ScorekeeperProtocol[], sql: string, args: any, like: any) {
    for (const t of tasks) {
        expect(await t.oneOrNone(sql, args)).toBeAttrLike(like)
    }
}

/**
 * There should never be a log entry with only the modified value as the change
 */
export async function verifyUpdateLogChanges(tasks: ScorekeeperProtocol[], table: string) {
    for (const t of tasks) {
        for (const row of await t.any("SELECT * from publiclog where tablen=$1 and action='U'", [table])) {
            const diff = odiff(row.olddata, row.newdata)
            expect(Object.keys(diff)).not.toEqual(['modified']) // not just modified that changed though trigger should catch that
        }
    }
}
