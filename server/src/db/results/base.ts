import { SeriesStatus } from '@common/series'
import { UUID } from '@common/util'
import { db } from '..'


// Helpers for basic results operations
const series = ''  // FINISH, move/remove
const seriestype = 0

export async function needEventUpdate(eventid: UUID): Promise<boolean> {
    // check if we can/need to update, look for specifc eventid in data to reduce unnecessary event churn when following a single event (live)
    if (seriestype !== SeriesStatus.ACTIVE) { return false }
    return db.task(async t => {
        const dm = new Date((await t.one("SELECT max(ltime) FROM publiclog WHERE tablen='drivers'")).max)
        const sm = new Date((await t.one("SELECT max(ltime) FROM serieslog WHERE tablen IN ('settings', 'classlist', 'indexlist', 'cars')")).max)
        const em = new Date((await t.one("SELECT max(ltime) FROM serieslog WHERE tablen IN ('events', 'runs', 'externalresults') AND " +
                              "(olddata->>'eventid'=$1::text OR newdata->>'eventid'=$1::text)", [eventid])).max)
        const rm = new Date((await t.one('SELECT modified   FROM results WHERE series=%s AND name=%s::text', [series, eventid])).max)
        return (rm.getTime() < Math.max(dm.getTime(), sm.getTime(), em.getTime()))
    })
}

export async function needUpdate(usedrivers: boolean, stables: string[], name: string): Promise<boolean> {
    // check if we can/need to update based on table changes
    if (seriestype !== SeriesStatus.ACTIVE) { return false }

    return db.task(async t => {
        let p
        if (usedrivers) {
            p = t.one('SELECT ' +
                '(SELECT MAX(times.max) FROM (SELECT max(ltime) FROM serieslog WHERE tablen IN $1:csv ' +
                'UNION ALL SELECT max(ltime) FROM publiclog WHERE tablen=\'drivers\') AS times) >' +
                '(SELECT modified FROM results WHERE series=$2 AND name=$3) AS result', [stables, series, name])
        } else {
            p = t.one('SELECT ' +
                '(SELECT max(ltime) FROM serieslog WHERE tablen IN $1:csv) >' +
                '(SELECT modified FROM results WHERE series=$2 AND name=$3) AS result', [stables, series, name])
        }
        const r = await (p).result
        return (r === null || r)
    })
}

export async function loadResults(name: string): Promise<any> {
    const r = (await db.one('SELECT data FROM results WHERE series=$1 and name=$2', [series, name])).data
    return r || {}
}

export async function insertResults(name: string, data: any): Promise<void> {
    /*
      Get access for modifying series rows, check if we need to insert a default first.
      Don't upsert as we have to specify LARGE json object twice.
    */
    return db.tx(async t => {
        await t.none('SET ROLE $1', [series])
        await t.none("INSERT INTO results VALUES ($1, $2, '{}', now()) ON CONFLICT (series, name) DO NOTHING", [series, name])
        await t.none('UPDATE results SET data=$1::json, modified=now() where series=$2 and name=$3', [data, series, name])
        await t.none('RESET ROLE')
    })
}
