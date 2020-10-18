import { ChampEntrant, ChampResults, DecoratedRun, Entrant, Event2Points, EventResults, ExternalResult, RunStatus } from '@common/results'
import { hasSessions, SeriesEvent } from '@common/event'
import { SeriesSettings } from '@common/settings'
import { UUID } from '@common/util'
import _ from 'lodash'
import { db } from '..'
import { insertResults } from './base'
import { getDList, getDObj } from '@/util/data'
import { PosPoints } from '@common/series'
import { getEventResults } from '.'

const y2k = new Date('2000-01-01')

export async function updateSeriesInfo(name) {
    const data = await db.task(async t => {
        return {
            events:     t.series.eventList(),
            // challenges: Challenge.getAll(), // FINISH
            classes:    t.clsidx.classList(),
            indexes:    t.clsidx.indexList(),
            settings:   t.series.seriesSettings()
        }
    })

    insertResults(name, data)
}

async function updateExternalEventResults(eventid: UUID, settings: SeriesSettings, ppoints: PosPoints) {
    /* The external event version of updateEventResults, only do point calculation based off of net result */
    const results = {} as {[key: string]: ExternalResult[]} // new Map<String, ExternalResult[]>()

    const data: ExternalResult[] = await db.any('SELECT r.*,d.firstname,d.lastname FROM drivers d JOIN externalresults r ON r.driverid=d.driverid WHERE r.eventid=$1', [eventid])
    for (const r of data) {
        getDList(results, r.classcode).push(r)
    }

    // Now for each class we can sort and update position, trophy, points(both types)
    for (const [clas, res] of Object.entries(results)) {
        _.orderBy(res, 'net')
        _.forEach(res, (r, ii) => {
            r.position   = ii + 1
            r.pospoints  = ppoints.get(r.position)
            r.diffpoints = res[0].net * 100 / r.net
            r.points     = settings.usepospoints ? r.pospoints : r.diffpoints
        })
    }

    insertResults(eventid, results)
}


export async function updateEventResults(eventid: UUID) {
    /*
        Creating the cached event result data for the given event.
        The event result data is {<classcode>, [<Entrant>]}.
        Each Entrant is a json object of attributes and a list of lists of Run objects ([course#][run#])
        Each Run object is regular run data with attributes like bestraw, bestnet assigned.
    */
    await db.task(async t => {

        const results   = {} as EventResults
        const cptrs     = new Map<[string, number], Entrant>()
        const event     = await t.series.getEvent(eventid)
        const classdata = await t.clsidx.getClassData()
        const settings  = await t.series.seriesSettings()
        const ppoints   = new PosPoints(settings.pospointlist)
        const sessions  = hasSessions(event)

        if (event.isexternal) {
            updateExternalEventResults(eventid, settings, ppoints)
            return
        }

        // Fetch all of the entrants (driver/car combo), place in class lists, save pointers for quicker access
        const data: Entrant[] = await t.any("SELECT e.rungroup,c.carid,d.firstname,d.lastname,d.attr->>'scca' as scca,c.* FROM drivers d " +
                        'JOIN cars c ON c.driverid=d.driverid INNER JOIN (select distinct carid, rungroup FROM runs WHERE eventid=$1) e ON c.carid = e.carid', [eventid])

        for (const e of data) { // [Entrant(**x) for x in cur.fetchall()]:
            if (e.carid in cptrs) continue // ignore duplicate carids from old series

            if (sessions) {
                getDList(results, e.rungroup + '').push(e)
                e.indexval = 1.0
                e.indexstr = ''
                e.classcode = ''
            } else {
                getDList(results, e.classcode).push(e)
                const index = classdata.getEffectiveIndex(e)
                e.indexval = index.value
                e.indexstr = index.str
            }

            e.runs = [] as DecoratedRun[][]
            for (const cc of _.range(event.courses)) {
                for (const rr of _.range(event.runs)) {
                    e.runs[cc][rr] = {
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
                        modified: y2k
                    }
                }
            }
            cptrs.set([e.carid, e.rungroup], e)
        }

        // Fetch all of the runs, calc net and assign to the correct entrant
        const runs: DecoratedRun[] = await t.any('SELECT * FROM runs WHERE eventid=$1 AND course<=$2 and run<=$3', [eventid, event.courses, event.runs])
        for (const r of runs) {
            if (r.raw <= 0) { continue } // ignore crap data that can't be correct

            const match = cptrs.get([r.carid, r.rungroup])
            if (!match) {
                // log.warning('missing match for carid/group')
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
        for (const e of cptrs.values()) {
            e.net = 0      // Best counted net overall time
            e.pen = 0      // Best counted unindexed overall time (includes penalties)
            e.netall = 0   // Best net of all runs (same as net when counted not active)
            e.penall = 0   // Best unindexed of all runs (same as pen when counted not active)
            if (event.ispro) {
                e.dialraw = 0  // Best raw times (OK status) used for dialin calculations
            }

            const counted = classdata.getCountedRuns(e.classcode, event)

            for (const course in _.range(event.courses)) {
                const bestrawall = marklist(_.orderBy([...e.runs[course]], 'raw'), 'arorder')
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
        for (const [key, res] of Object.entries(results)) {
            const trophydepth = Math.ceil(res.length / 3.0)
            const eventtrophy = sessions || classdata.classlist[key].eventtrophy

            _.orderBy(res, 'net')

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

        insertResults(eventid, results)
    })
}



function calcPoints(event2points: Event2Points, bestof: number) {
    const drop    = [] as UUID[]
    const ordered = _.orderBy(Object.entries(event2points), 1, 'desc')
    let total     = 0
    ordered.forEach((item, index) => {
        if (index < bestof) {
            total += item[1]  // Add to total points
        } else {
            drop.push(item[0])  // Otherwise this is a drop event, mark eventid
        }
    })
    return total
}

function champEventKey(event: SeriesEvent) {
    return `d-${event.date}-id-${event.eventid}`
}

function champAddEventResults(centry: ChampEntrant, event: SeriesEvent, entry: Entrant) {
    centry.firstname = entry.firstname
    centry.lastname  = entry.lastname
    centry.driverid  = entry.driverid
    const idx = entry.position - 1
    if (idx < centry.tiebreakers.length - 1) {
        centry.tiebreakers[idx] += 1
    }
    centry.eventcount += 1
    centry._pstorage[champEventKey(event)] = entry.points
}

function champEntrantFinalize(centry: ChampEntrant, bestof: number, events: SeriesEvent[]) {
    centry.points = calcPoints(centry._pstorage, bestof)
    centry.missingrequired = events.filter(e => e.champrequire && !(champEventKey(e) in centry._pstorage)).map(e => champEventKey(e))
    for (const e of events) {
        if (e.useastiebreak) {
            centry.tiebreakers.unshift(centry._pstorage[champEventKey(e)] || 0)
        }
    }
    centry.tiebreakers.push(centry.eventcount)
}


export async function updateChampResults(name: string) {
/*
    Create the cached result for champ results.
    If justeventid is None, we load all event results and create the champ results.
    If justeventid is not None, we use the previous champ results and just update the event
        (saves loading/parsing all events again)
    Returns a dict of ChampClass objects
*/
    await db.task(async t => {

        const now       = new Date()
        const settings  = await t.series.seriesSettings()
        const classdata = await t.clsidx.getClassData()
        const events    = await t.series.eventList()
        let completed   = 0

        // Interm storage while we distribute result data by driverid
        const store = {} as {[classcode: string]: { [driverid: string]: ChampEntrant }}

        for (const event of events) {
            if (event.ispractice) continue
            if (now >= new Date(event.date)) {
                completed += 1
            }

            const eventresults = await getEventResults(event.eventid)
            for (const classcode in eventresults) {
                if (!classdata.classlist[classcode].champtrophy) { // class doesn't get champ trophies, ignore
                    continue
                }
                const classmap = getDObj(store, classcode)
                for (const entrant of eventresults[classcode]) {
                    champAddEventResults(classmap[entrant.driverid], event, entrant)
                }
            }
        }

        const todrop = settings.dropevents
        const bestof = Math.max(todrop, completed - todrop)

        // Final storage where results are an ordered list rather than map
        const ret = {} as ChampResults
        for (const [classcode, classmap] of Object.entries(store)) {
            for (const entrant of Object.values(classmap)) {
                champEntrantFinalize(entrant, bestof, events)
                ret[classcode].push(entrant)
            }
            _.orderBy(ret[classcode], ['points', 'tiebreakers'], 'desc')
            let ii = 1
            for (const e of ret[classcode]) {
                if (e.eventcount < settings.minevents || e.missingrequired.length > 0) {
                    e.position = null
                } else {
                    e.position = ii
                    ii += 1
                }
            }
        }

        insertResults(name, ret)
    })
}
