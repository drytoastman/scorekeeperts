/* eslint-disable max-len */
import _ from 'lodash'

import { hasSessions, DecoratedRun, Entrant, EventResults, ExternalChampResult, RunStatus, PosPoints, SeriesInfo, SeriesSettings, UUID, getDList, make2D, getSessions } from 'sctypes'
import { ScorekeeperProtocol, dblog } from '..'

export async function updatedSeriesInfo(task: ScorekeeperProtocol): Promise<SeriesInfo> {
    dblog.debug('updatedSeriesInfo')
    const ret = {
        events:     await task.events.eventList(),
        challenges: await task.challenge.challengeList(),
        classes:    await task.clsidx.classList(),
        indexes:    await task.clsidx.indexList(),
        settings:   await task.series.seriesSettings()
    }
    ret.events.forEach(e => {
        Object.assign(e, e.attr)
        delete e.attr
    })
    return ret
}

async function updatedExternalEventResults(task: ScorekeeperProtocol, eventid: UUID, settings: SeriesSettings, ppoints: PosPoints): Promise<EventResults> {
    /* The external event version of updateEventResults, only do point calculation based off of net result */
    dblog.debug(`updatedExternalEventResults ${eventid}`)

    const results = {} as {[key: string]: ExternalChampResult[]}
    const data: ExternalChampResult[] = await task.any('SELECT r.*,d.firstname,d.lastname FROM drivers d JOIN externalresults r ON r.driverid=d.driverid WHERE r.eventid=$1', [eventid])
    for (const r of data) {
        getDList(results, r.classcode).push(r)
    }

    // Now for each class we can sort and update position, trophy, points(both types)
    for (const key in results) {
        const res = results[key] = _.orderBy(results[key], 'net')
        res.forEach((r, ii) => {
            r.position   = ii + 1
            r.pospoints  = ppoints.get(r.position)
            r.diffpoints = res[0].net * 100 / r.net
            r.points     = settings.usepospoints ? r.pospoints : r.diffpoints
            r.runs       = []
        })
    }

    return results as any
}


export async function updatedEventResults(task: ScorekeeperProtocol, eventid: UUID): Promise<EventResults> {
    /*
        Creating the cached event result data for the given event.
        The event result data is {<classcode>, [<Entrant>]}.
        Each Entrant is a json object of attributes and a list of lists of Run objects ([course#][run#])
        Each Run object is regular run data with attributes like bestraw, bestnet assigned.
    */
    dblog.debug(`updatedEventResults ${eventid}`)

    const results   = {} as EventResults
    const cptrs     = {} as {[key: string]: Entrant}
    const event     = await task.events.getEvent(eventid)
    const classdata = await task.clsidx.getClassData()
    const settings  = await task.series.seriesSettings()
    const ppoints   = new PosPoints(settings.pospointlist)
    const sessions  = hasSessions(event)

    if (event.isexternal) {
        return updatedExternalEventResults(task, eventid, settings, ppoints)
    }

    function ekey(e: {carid: string, rungroup: number}) { return e.carid + '?' + e.rungroup }

    // Fetch all of the entrants (driver/car combo), place in class lists, save pointers for quicker access
    const data: Entrant[] = await task.any("SELECT e.rungroup,c.carid,d.firstname,d.lastname,d.attr->>'scca' as scca,c.* FROM drivers d " +
                        'JOIN cars c ON c.driverid=d.driverid INNER JOIN (select distinct carid, rungroup FROM runs WHERE eventid=$1) e ON c.carid = e.carid', [eventid])

    for (const e of data) { // [Entrant(**x) for x in cur.fetchall()]:
        if (ekey(e) in cptrs) continue // ignore duplicate carids from old series
        Object.assign(e, e.attr)
        delete e.attr

        if (sessions) {
            const slist = getSessions(event)
            const sess = (e.rungroup > 0 && e.rungroup - 1 < slist.length) ? slist[e.rungroup - 1] : 'Unknown'

            getDList(results, sess).push(e)
            e.indexval = 1.0
            e.indexstr = ''
            e.classcode = sess
        } else {
            getDList(results, e.classcode).push(e)
            const index = classdata.getEffectiveIndex(e)
            e.indexval = index.value
            e.indexstr = index.str
        }

        e.runs = make2D(event.courses)
        for (const cc of _.range(event.courses)) {
            for (const rr of _.range(event.runs)) {
                e.runs[cc][rr] = {
                    eventid: '',
                    carid: '',
                    rungroup: e.rungroup,
                    course: cc + 1,
                    run: rr + 1,
                    raw: 999.999,
                    cones: 0,
                    gates: 0,
                    pen: 999.999,
                    net: 999.999,
                    status: RunStatus.PLC,
                    norder: -1,
                    rorder: -1,
                    anorder: -1,
                    modified: '2000-01-01T00:00:00.000Z'
                }
            }
        }

        cptrs[ekey(e)] =  e
    }

    // Fetch all of the runs, calc net and assign to the correct entrant
    const runs: DecoratedRun[] = await task.any('SELECT * FROM runs WHERE eventid=$1 AND course<=$2 and run<=$3', [eventid, event.courses, event.runs])
    for (const r of runs) {
        Object.assign(r, r.attr)
        delete r.attr
        if (r.raw <= 0) { continue } // ignore crap data that can't be correct

        const match = cptrs[ekey(r)]
        if (!match) {
            dblog.warn('missing match for carid/group')
            continue
        }

        match.runs[r.course - 1][r.run - 1] = r
        const penalty = (r.cones * event.conepen) + (r.gates * event.gatepen)
        if (r.status !== RunStatus.OK) {
            r.pen = 999.999
            r.net = 999.999
        } else if (settings.indexafterpenalties) {
            r.pen = r.raw + penalty
            r.net = r.pen * match.indexval
        } else {
            r.pen = r.raw + penalty
            r.net = (r.raw * match.indexval) + penalty
        }
    }

    function marklist(list: DecoratedRun[], label: string) {
        list.forEach((run, index) => { run[label] = index + 1 })
        return list
    }

    // For every entrant, calculate their best runs (raw,net,allraw,allnet) and event sum(net)
    for (const e of Object.values(cptrs)) {
        e.net = 0      // Best counted net overall time
        e.pen = 0      // Best counted unindexed overall time (includes penalties)
        e.netall = 0   // Best net of all runs (same as net when counted not active)
        e.penall = 0   // Best unindexed of all runs (same as pen when counted not active)
        if (event.ispro) {
            e.dialraw = 0  // Best raw times (OK status) used for dialin calculations
        }

        const counted = classdata.getCountedRuns(e.classcode, event)

        for (const course in _.range(event.courses)) {
            const bestnetall = marklist(_.orderBy([...e.runs[course]], 'net'), 'anorder')
            const bestraw    = marklist(_.orderBy([...e.runs[course].slice(0, counted)], 'raw'), 'rorder')
            const bestnet    = marklist(_.orderBy([...e.runs[course].slice(0, counted)], 'net'), 'norder')
            e.netall += bestnetall[0].net
            e.penall += bestnetall[0].pen
            e.net += bestnet[0].net
            e.pen += bestnet[0].pen
            if (event.ispro) {
                e.dialraw += bestraw[0].raw
            }
        }
    }

    // Now for each class we can sort and update position, trophy, points(both types)
    for (const key in results) {
        const res = results[key] = _.orderBy(results[key], 'net')
        const trophydepth = Math.ceil(res.length / 3.0)
        const eventtrophy = sessions || classdata.classlist[key].eventtrophy

        res.forEach((e, ii) => {
            e.position   = ii + 1
            e.trophy     = eventtrophy && (ii < trophydepth)
            e.pospoints  = ppoints.get(e.position)
            e.diffpoints = res[0].net * 100 / e.net
            e.points     = settings.usepospoints ? e.pospoints : e.diffpoints
            if (ii === 0) {
                e.diff1  = 0.0
                e.diffn  = 0.0
            } else {
                e.diff1  = (e.net - res[0].net) / e.indexval
                e.diffn  = (e.net - res[ii - 1].net) / e.indexval
            }

            // Dialins for pros
            if (event.ispro) {
                e.bonusdial = e.dialraw / 2.0
                if (ii === 0) {
                    e.prodiff = res.length > 1 ? e.net - res[1].net : 0.0
                    e.prodial = e.bonusdial
                } else {
                    e.prodiff = e.net - res[0].net
                    e.prodial = res[0].dialraw * res[0].indexval / e.indexval / 2.0
                }
            }
        })
    }

    return results
}
