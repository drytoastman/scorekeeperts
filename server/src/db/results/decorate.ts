import { BlankEntrant, Entrant, EventResults, getBestNetRun, getLastCourse, getLastRun } from '@common/entrant'
import { PosPoints } from '@common/event'
import { SeriesSettings } from '@common/settings'
import { UUID } from '@common/util'
import _ from 'lodash'

export function decorateEntrant(e: Entrant) {
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

export function decorateClassResults(settings: SeriesSettings, eventresults: EventResults, carids: UUID[], rungroup = 0): [Entrant[], Entrant[]] {
    /* Calculate things for the announcer/info displays */
    // carids = list(map(str, carids)) // json data holds UUID as strings
    const ppoints = new PosPoints(settings.pospointlist)
    // const drivers = new Map<UUID, Entrant>();
    let entrantlist: Entrant[]|null = null

    // Find the class and entrants for the results
    for (const [clscode, entrants] of eventresults.entries()) {
        for (const e of entrants) {
            if (rungroup && e.rungroup !== rungroup) continue
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
    const decoratedlist = _.cloneDeep(entrantlist)
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
            const position = _.indexOf(sumlist, e.oldnet) + 1
            e.oldpoints = settings.usepospoints ? ppoints.get(position) : sumlist[0] * 100 / e.oldnet
            _.remove(sumlist, e.oldnet)
            decoratedlist.push(new BlankEntrant({ firstname:e.firstname, lastname:e.lastname, net:e.oldnet, isold: true }))
        }
        if (e.potnet) {
            sumlist.push(e.potnet)
            sumlist.sort()
            const position = _.indexOf(sumlist, e.potnet) + 1
            e.potpoints = settings.usepospoints ? ppoints.get(position) : sumlist[0] * 100 / e.potnet
            decoratedlist.push(new BlankEntrant({ firstname:e.firstname, lastname:e.lastname, net:e.potnet, ispotential: true }))
        }
    }

    // Mark this entrant as current, clear others if decorate is called multiple times ???
    _.orderBy(decoratedlist, 'net')

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

    return [decoratedlist, sortedmarks]
}
