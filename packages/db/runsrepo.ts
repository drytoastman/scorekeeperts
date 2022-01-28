import { IMain } from 'pg-promise'
import { UTCString, UUID, Run, ExternalResult } from 'sctypes'
import { ScorekeeperProtocol, TABLES } from '.'

export class RunsRepository {
    constructor(private db: ScorekeeperProtocol, private pgp: IMain) {
    }

    async getRuns(eventid: UUID, carid: UUID): Promise<Run[]> {
        return this.db.any('SELECT * FROM runs WHERE eventid=$1 AND carid=$2', [eventid, carid])
    }

    async updateRuns(runs: Run[]): Promise<Run[]> {
        const ret = [] as Run[]
        for (const run of runs) {
            if (run.delete) {
                await this.db.none('DELETE FROM runs WHERE eventid=$(eventid) AND carid=$(carid) AND rungroup=$(rungroup) AND course=$(course) AND run=$(run)', run)
            } else {
                const res = await this.db.oneOrNone(this.pgp.helpers.insert([run], TABLES.runs) +
                                    ' ON CONFLICT (eventid,carid,rungroup,course,run) DO UPDATE SET ' +
                                    this.pgp.helpers.sets(run, TABLES.runs) + ' RETURNING *')
                if (res) ret.push(res) // null means nothing changed do trigger stopped it
            }
        }
        return ret
    }

    async getLastRun(eventid: UUID, earliest: UTCString, classcodefilter?: string, coursefilter?: number): Promise<Run&{classcode:string}|undefined> {
        // Search through serieslog rather than tables so that we can pick up deletes as well as regular insert/update
        const args = { earliest, eventid, classcodefilter, coursefilter }

        let filt = ''
        if (classcodefilter) filt += 'AND lower(c.classcode)=lower($(classcodefilter)) '
        if (coursefilter)    filt += "AND (s.newdata->>'course'=$(coursefilter)::text OR s.olddata->>'course'=$(coursefilter)::text) "

        const row = await this.db.oneOrNone('select s.ltime, c.carid, c.classcode, s.olddata, s.newdata ' +
                        "FROM serieslog s JOIN cars c ON c.carid=uuid(s.newdata->>'carid') OR c.carid=uuid(s.olddata->>'carid') " +
                        "WHERE s.tablen='runs' AND s.ltime > $(earliest) AND (s.newdata->>'eventid'=$(eventid) OR s.olddata->>'eventid'=$(eventid)) " +
                        filt + ' ORDER BY s.ltime DESC LIMIT 1', args)

        if (!row) return undefined
        return Object.assign(row.newdata || row.olddata, { classcode: row.classcode, modified: row.ltime })
    }


    async getRunOrder(eventid: UUID, course: number, rungroup: number): Promise<UUID[]> {
        // Returns a list of objects (classcode, carid) for the next cars in order after carid """
        return await this.db.map('SELECT unnest(cars) cid from runorder WHERE eventid=$(eventid) AND course=$(course) AND rungroup=$(rungroup)',
                                        { eventid, course, rungroup }, r => r.cid)
    }

    async getNextRunOrder(aftercarid: UUID, eventid: UUID, course: number, rungroup: number, classcodefilter?: string, count = 3):
        Promise<Array<{carid: UUID, classcode: string, number: number}>> {

        // Returns a list of objects (classcode, carid) for the next cars in order after carid """
        const order = await this.getRunOrder(eventid, course, rungroup)
        const ret = [] as any[]
        for (const [ii, rowid] of order.entries()) {
            if (rowid === aftercarid) {
                for (let jj = 1; jj < order.length; jj++) {
                    const idx = (ii + jj) % order.length
                    const nextinfo = await this.db.one('SELECT c.carid,c.classcode,c.number from cars c WHERE carid=$1', [order[idx]])
                    if (classcodefilter && nextinfo.classcode !== classcodefilter) {
                        continue
                    }
                    ret.push(nextinfo)
                    if (ret.length >= count) break
                }
                break
            }
        }

        return ret
    }

    async setExternalResults(results: ExternalResult[]): Promise<ExternalResult[]> {
        const ret = [] as ExternalResult[]
        for (const res of results) {
            const out = await this.db.oneOrNone('INSERT INTO externalresults (eventid, driverid, classcode, net) VALUES ($1, $2, $3, $4) ' +
                                    ' ON CONFLICT (eventid, driverid, classcode) DO UPDATE SET net=$4,modified=now() RETURNING *',
                                    [res.eventid, res.driverid, res.classcode, res.net])
            if (out) ret.push(out) // null means nothing changed do trigger stopped it
        }
        return ret
    }

    /**
     * Returns a map of event UUID to list of driver UUID for each event
     */
    async attendance(): Promise<{[key: string]: UUID[]}> {
        const rows = await this.db.any('SELECT DISTINCT r.eventid,c.driverid FROM runs r JOIN cars c ON c.carid=r.carid')
        const ret = {}
        for (const row of rows) {
            if (!(row.eventid in ret)) ret[row.eventid] = new Set()
            ret[row.eventid].add(row.driverid)
        }
        for (const eventid in ret) {
            ret[eventid] = Array.from(ret[eventid])
        }
        return ret
    }

    /**
     * Returns an map of driver UUID to map of event UUID to list of classcodes for each driver
     */
    async driverAttendance(): Promise<{[key: string]: { [key: string]: {classcode: string, indexcode: string}}}> {
        const rows = await this.db.any('SELECT DISTINCT r.eventid,c.driverid,c.classcode,c.indexcode FROM runs r JOIN cars c ON c.carid=r.carid')
        const ret = {}
        for (const row of rows) {
            if (!(row.driverid in ret)) ret[row.driverid] = {}
            if (!(row.eventid in ret[row.driverid])) ret[row.driverid][row.eventid] = new Set()
            ret[row.driverid][row.eventid].add({ classcode: row.classcode, indexcode: row.indexcode })
        }
        for (const driverid in ret) {
            for (const eventid in ret[driverid]) {
                ret[driverid][eventid] = Array.from(ret[driverid][eventid])
            }
        }
        return ret
    }
}
