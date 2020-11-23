import { ScorekeeperProtocol, pgp, db as dbx } from '@/db'
import { runOnce } from '../process'

const testids = {
    driverid1: '00000000-0000-0000-0000-000000000001',
    carid1:    '00000000-0000-0000-0000-000000000002',
    carid2:    '00000000-0000-0000-0000-000000000003',
    carid3:    '00000000-0000-0000-0000-000000000004',
    eventid1:  '00000000-0000-0000-0000-000000000010',
    series:    'testseries'
}

const SQL = `
DROP SCHEMA IF EXISTS $(series:raw) CASCADE;
DELETE FROM drivers;
DELETE FROM publiclog;

SELECT verify_user($(series), $(series));
SELECT verify_series($(series));

SET search_path=$(series),'public';

INSERT INTO indexlist (indexcode, descrip, value) VALUES ('',   '', 1.000);
INSERT INTO indexlist (indexcode, descrip, value) VALUES ('i1', '', 1.000);
INSERT INTO classlist (classcode, descrip, indexcode, caridxrestrict, classmultiplier, carindexed, usecarflag, eventtrophy, champtrophy, secondruns, countedruns, modified) VALUES ('c1', '', '', '', 1.0, 't', 'f', 't', 't', 'f', 0, now());
INSERT INTO classlist (classcode, descrip, indexcode, caridxrestrict, classmultiplier, carindexed, usecarflag, eventtrophy, champtrophy, secondruns, countedruns, modified) VALUES ('c2', '', '', '', 1.0, 't', 'f', 't', 't', 'f', 0, now());
INSERT INTO classlist (classcode, descrip, indexcode, caridxrestrict, classmultiplier, carindexed, usecarflag, eventtrophy, champtrophy, secondruns, countedruns, modified) VALUES ('c3', '', '', '', 1.0, 't', 'f', 't', 't', 'f', 0, now());
INSERT INTO classlist (classcode, descrip, indexcode, caridxrestrict, classmultiplier, carindexed, usecarflag, eventtrophy, champtrophy, secondruns, countedruns, modified) VALUES ('c4', '', '', '', 1.0, 't', 'f', 't', 't', 'f', 0, now());
INSERT INTO classlist (classcode, descrip, indexcode, caridxrestrict, classmultiplier, carindexed, usecarflag, eventtrophy, champtrophy, secondruns, countedruns, modified) VALUES ('c5', '', '', '', 1.0, 't', 'f', 't', 't', 'f', 0, now());

INSERT INTO drivers (driverid, firstname, lastname, email, username, password, created) VALUES ($(driverid1), 'first', 'last', 'email', 'username', '$2b$12$g0z0JiGEuCudjhUF.5aawOlho3fpnPqKrV1EALTd1Cl/ThQQpFi2K', '1970-01-01T00:00:00');
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

const dbmap = new Map<number, ScorekeeperProtocol>()
export function getTestDB(port: number): ScorekeeperProtocol {
    if (!dbmap.has(port)) {
        dbmap.set(port, pgp(Object.assign({}, dbx.$cn, { user: 'postgres', port: port })))
    }
    return dbmap.get(port) as ScorekeeperProtocol
}

export async function resetData(ports: number[]) {
    try {
        await Promise.all(ports.map(p => getTestDB(p).none(SQL, testids)))
    } catch (error) {
        console.error(error)
    }
}

export async function doSync(port: number, hosts?: string[]) {
    const db = getTestDB(port)
    if (hosts) {
        db.none("UPDATE mergeservers SET lastcheck='epoch', nextcheck='epoch' WHERE hostname in ($1:csv)", [hosts])
    } else {
        db.none("UPDATE mergeservers SET lastcheck='epoch', nextcheck='epoch'")
    }
    runOnce(db)
}

async function verifyObject(ports: number[], pid: any, coltuple: any, attrtuple: any, sql: string) {
    const objs = {}
    for (const port of ports) {
        objs[port] = await getTestDB(port).one(sql, pid)
    }
    expect(objs[ports[0]]).toEqual(objs[ports[1]]) // only two ports for now
}

export async function verifyAccount(ports: number[], accountid: string, coltuple?: any) {
    return verifyObject(ports, accountid, coltuple, [], 'SELECT * FROM paymentaccounts WHERE accountid=$1')
}
