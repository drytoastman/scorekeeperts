import cloneDeep from 'lodash/cloneDeep'
import indexOf from 'lodash/indexOf'
import maxBy from 'lodash/maxBy'
import orderBy from 'lodash/orderBy'
import remove from 'lodash/remove'

import { ChampEntrant, ChampNotice, ChampResults, DecoratedRun, Entrant, EventNotice, EventResults, RunStatus } from './results'
import { PosPoints } from './series'
import { SeriesSettings } from './settings'
import { parseTimestamp, UUID } from './util'

const y2k = new Date('2000-01-01')

export function getLastCourse(e: Entrant): number {
    /* Find the last course information for an entrant based on mod tags of runs, unless is already specified */
    if (e.lastcourse) return e.lastcourse

    let lasttime = y2k
    for (const c of e.runs) {
        for (const r of c) {
            const mod = parseTimestamp(r.modified)
            if (mod > lasttime) {
                lasttime = mod
                e.lastcourse = r.course
            }
        }
    }

    return e.lastcourse
}

export function getBestNetRun(e: Entrant, course = 0, norder = 1): DecoratedRun|undefined {
    /*
        Get the best net run for last course run by an entrant
        If course is specified, overrides default of last
        If norder is specified, overrides default of 1
    */
    if (course === 0) {
        course = getLastCourse(e)
    }
    return e.runs[course - 1].filter(r => r.norder === norder && r.status !== RunStatus.PLC)[0] || undefined
}

export function getLastRun(e: Entrant): DecoratedRun|undefined {
    /* Get the last recorded run on any course */
    const course = getLastCourse(e)
    const runs: DecoratedRun[] = e.runs[course - 1].filter(r => r.status !== RunStatus.PLC)
    return maxBy(runs, 'run')
}

export function decorateEntrant(e: Entrant): void {
    /* Calculate things that apply to just the entrant in question (used by class and toptimes) */

    // Always work with the last run by run number (Non Placeholder), then get first and second bestnet
    e.lastcourse = getLastCourse(e)
    const lastrun = getLastRun(e)
    const norder1 = getBestNetRun(e)
    const norder2 = getBestNetRun(e, 0, 2)
    const key     = 'anorder' // norder doesn't exist when counted runs take effect

    if ((!lastrun) || (!norder1)) return

    // Can't have any improvement if we only have one run
    if (norder2) {
        // Note net improvement, mark what the old net would have been
        if (lastrun[key] === 1 && norder2) {
            lastrun.netimp = lastrun.net - norder2.net
            norder2.oldbest = true
            e.oldnet = e.net - lastrun.net + norder2.net
        }

        // Note raw improvement over previous best run
        // This can be n=2 for overall improvement, or n=1 if only raw, not net improvement
        if (lastrun[key] === 1) {
            lastrun.rawimp = lastrun.raw - norder2.raw
        } else {
            lastrun.rawimp = lastrun.raw - norder1.raw
        }
    }

    // If last run had penalties, add data for potential run without penalties
    if (lastrun.cones !== 0 || lastrun.gates !== 0) {
        const potnet = e.net - norder1.net + (lastrun.raw * e.indexval)
        if (potnet < e.net) {
            e.potnet = potnet
            if (lastrun[key] !== 1) {
                lastrun.ispotential = true
            }
        }
    }
}

export function decorateClassResults(settings: SeriesSettings, eventresults: EventResults, carids: UUID[], rungroupfilter?: number): [Entrant[], Entrant[]] {
    /* Calculate things for the announcer/info displays */
    // carids = list(map(str, carids)) // json data holds UUID as strings
    const ppoints = new PosPoints(settings.pospointlist)
    // const drivers = new Map<UUID, Entrant>();
    let entrantlist: Entrant[]|null = null

    // Find the class and entrants for the results
    for (const [, entrants] of Object.entries(eventresults)) {
        for (const e of entrants) {
            if (rungroupfilter && e.rungroup !== rungroupfilter) continue
            if (!carids.includes(e.carid)) continue
            entrantlist = entrants
            // drivers[e.carid] = e
        }
        if (entrantlist) {
            break
        }
    }

    if (!entrantlist) {
        return [[], []]
    }

    // Figure out points changes for the class
    const sumlist = entrantlist.map(e => e.net)
    // sumlist.remove(e.net) used to be drivers[e.carid]

    // Return a copy so we can decorate in different ways during a single session (new websocket feed)
    const decoratedlist = cloneDeep(entrantlist)
    const notelist = decoratedlist as unknown as EventNotice[]
    const markedlist: Entrant[] = []

    // Decorate our copied entrants with run change information
    for (const e of decoratedlist) {
        if (!e) continue
        if (carids.includes(e.carid)) {
            decorateEntrant(e)
            e.current = true
            markedlist.push(e)
        }

        if (e.oldnet) {
            sumlist.push(e.oldnet)
            sumlist.sort()
            const position = indexOf(sumlist, e.oldnet) + 1
            e.oldpoints = settings.usepospoints ? ppoints.get(position) : sumlist[0] * 100 / e.oldnet
            remove(sumlist, e.oldnet)
            notelist.push({ firstname:e.firstname, lastname:e.lastname, net:e.oldnet, isold: true, ispotential: false })
        }
        if (e.potnet) {
            sumlist.push(e.potnet)
            sumlist.sort()
            const position = indexOf(sumlist, e.potnet) + 1
            e.potpoints = settings.usepospoints ? ppoints.get(position) : sumlist[0] * 100 / e.potnet
            notelist.push({ firstname:e.firstname, lastname:e.lastname, net:e.potnet, ispotential: true, isold: false })
        }
    }

    // Mark this entrant as current, clear others if decorate is called multiple times ???

    // Keep the marked list in the same order as passed in carids
    const sortedmarks: Entrant[] = []
    for (const cid of carids) {
        for (const m of markedlist) {
            if (m.carid === cid) {
                sortedmarks.push(m)
                break
            }
        }
    }

    return [orderBy(decoratedlist, 'net'), sortedmarks]
}

export function decorateChampResults(champresults: ChampResults, markentrants: Entrant[]): ChampEntrant[] {
    /* Calculate things for the announcer/info displays */
    const champclass = champresults[markentrants[0].classcode]
    if (!champclass) return []
    const newlist = cloneDeep(champclass)
    const notelist = newlist as unknown as ChampNotice[]

    for (const champe of newlist) {
        let entrant: Entrant|null = null
        for (const me of markentrants) {
            if (champe.driverid === me.driverid) {
                entrant = me
                break
            }
        }

        if (!entrant) {
            continue
        }

        champe.current = true
        if (entrant.oldpoints && entrant.oldpoints < entrant.points) {
            const total = champe.points.total - entrant.points + entrant.oldpoints
            notelist.push({ firstname:champe.firstname, lastname:champe.lastname, points:{ total:total }, isold:true, ispotential: false })
        }

        if (entrant.potpoints && entrant.potpoints > entrant.points) {
            const total = champe.points.total - entrant.points + entrant.potpoints
            notelist.push({ firstname:champe.firstname, lastname:champe.lastname, points:{ total:total }, ispotential: true, isold: false })
        }
    }

    return orderBy(newlist, 'points.total', 'desc')
}
