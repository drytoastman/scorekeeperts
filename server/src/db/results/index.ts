/*
    Interface into the results table for cached results.  This is the primary source of information
    for the results, json and xml controllers as the data is present even if the series has been
    archived.  If the series is active and the data in the regular tables is more up to date, we
    regenerate the values in the results table.
    Names are:
        info   - series info structure
        champ  - championship data
        [UUID] - event or challenge result data matched to that id
*/

import _ from 'lodash'
import { UUID } from '@common/util'
import { SeriesInfo, SeriesStatus } from '@common/series'
import { updatedSeriesInfo, updatedEventResults } from './calc'
import { SeriesSettings } from '@common/settings'
import { decorateChampResults, decorateClassResults } from './decorate'
import { ChampEntrant, ChampResults, Entrant, EventResults, TopTimesKey, TopTimesTable } from '@common/results'
import { updatedChallengeResults } from './calcchallenge'
import { updatedChampResults } from './calcchamp'
import { ClassData } from '@common/classindex'
import { loadTopTimesTable } from './calctoptimes'
import { ScorekeeperProtocol } from '..'
import { ChallengeResults } from '@common/challenge'
import { dblog } from '@/util/logging'


export class ResultsRepository {
    // eslint-disable-next-line no-useless-constructor
    constructor(private db: ScorekeeperProtocol) {}

    async cacheAll(): Promise<void> {
        const series = await this.getCurrent()
        if (await this.getStatus(series) !== SeriesStatus.ACTIVE) return // can't cache non-active

        dblog.info(`cacheAll ${series}`)
        const info = await this.getSeriesInfo()
        for (const e of info.events) { await this.getEventResults(e.eventid) }
        // for (const c of info.challenges) { this.getChallengeResults(c.challengeid) }
        await this.getChampResults()
    }


    async getSeriesInfo(): Promise<SeriesInfo> {
        const name = 'info'
        if (await this.needUpdate(false, ['challenges', 'classlist', 'indexlist', 'events', 'settings'], name)) {
            await this.insertResults(name, updatedSeriesInfo(this.db))
        }
        return this.loadResults(name)
    }


    async getEventResults(eventid: UUID): Promise<EventResults> {
        if (await this.needEventUpdate(eventid)) {
            await this.insertResults(eventid, updatedEventResults(this.db, eventid))
        }
        return this.loadResults(eventid)
    }


    async getChallengeResults(challengeid: UUID): Promise<ChallengeResults> {
        if (await this.needUpdate(true, ['challengerounds', 'challengeruns'], challengeid)) {
            await this.insertResults(challengeid, updatedChallengeResults(this.db, challengeid))
        }
        return this.loadResults(challengeid)
    }


    async getChampResults(): Promise<ChampResults> {
        const name = 'champ'
        if (await this.needUpdate(true, ['settings', 'classlist', 'indexlist', 'events', 'cars', 'runs', 'externalresults'], name)) {
            await this.insertResults(name, updatedChampResults(this.db))
        }
        return this.loadResults(name)
    }


    private async needEventUpdate(eventid: UUID): Promise<boolean> {
        // check if we can/need to update, look for specifc eventid in data to reduce unnecessary event churn when following a single event (live)
        const series = await this.getCurrent()
        if (await this.getStatus(series) !== SeriesStatus.ACTIVE) return false

        const dm = new Date((await this.db.one("SELECT max(ltime) FROM publiclog WHERE tablen='drivers'")).max)
        const sm = new Date((await this.db.one("SELECT max(ltime) FROM serieslog WHERE tablen IN ('settings', 'classlist', 'indexlist', 'cars')")).max)
        const em = new Date((await this.db.one("SELECT max(ltime) FROM serieslog WHERE tablen IN ('events', 'runs', 'externalresults') AND " +
                                  "(olddata->>'eventid'=$1::text OR newdata->>'eventid'=$1)", [eventid])).max)
        const res = await this.db.oneOrNone('SELECT modified FROM results WHERE series=$1 AND name=$2', [series, eventid])
        if (!res) return true

        const rm = new Date(res.modified)
        return (rm.getTime() < Math.max(dm.getTime(), sm.getTime(), em.getTime()))
    }


    private async needUpdate(usedrivers: boolean, stables: string[], name: string): Promise<boolean> {
        // check if we can/need to update based on table changes
        const series = await this.getCurrent()
        if (await this.getStatus(series) !== SeriesStatus.ACTIVE) return false

        let p: Promise<any>
        if (usedrivers) {
            p = this.db.one('SELECT ' +
                    '(SELECT MAX(times.max) FROM (SELECT max(ltime) FROM serieslog WHERE tablen IN ($1:csv) ' +
                    'UNION ALL SELECT max(ltime) FROM publiclog WHERE tablen=\'drivers\') AS times) >' +
                    '(SELECT modified FROM results WHERE series=$2 AND name=$3) AS result', [stables, series, name])
        } else {
            p = this.db.one('SELECT ' +
                    '(SELECT max(ltime) FROM serieslog WHERE tablen IN ($1:csv)) >' +
                    '(SELECT modified FROM results WHERE series=$2 AND name=$3) AS result', [stables, series, name])
        }
        const r = (await p).result
        return (r === null || r)
    }


    private async loadResults(name: string): Promise<any> {
        const series = await this.getCurrent()
        const r = (await this.db.one('SELECT data FROM results WHERE series=$1 and name=$2', [series, name])).data
        return r || {}
    }


    private async insertResults(name: string, data: any): Promise<void> {
        /*
          Get access for modifying series rows, check if we need to insert a default first.
          Don't upsert as we have to specify LARGE json object twice.
        */
        const resolved = await Promise.resolve(data)  // incase data is a promise
        const series = await this.getCurrent()
        return this.db.tx(async tx => {
            await tx.none('SET ROLE $1', [series])
            await tx.none("INSERT INTO results VALUES ($1, $2, '{}', now()) ON CONFLICT (series, name) DO NOTHING", [series, name])
            await tx.none('UPDATE results SET data=$1::json, modified=now() where series=$2 and name=$3', [resolved, series, name])
            await tx.none('RESET ROLE')
        })
    }


    private async getCurrent(): Promise<string> {
        const res = await this.db.one('SHOW search_path')
        return res.search_path.split(',')[0]
    }

    private async getStatus(series: string): Promise<SeriesStatus> {
        if (await this.db.oneOrNone('select schema_name from information_schema.schemata where schema_name=$1', [series])) {
            return SeriesStatus.ACTIVE
        } else {
            const res2 = await this.db.one('select count(1) from results where series=$1', [series])
            if (res2.count >= 2) return SeriesStatus.ARCHIVED
        }
        return SeriesStatus.INVALID
    }
}
