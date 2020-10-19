import _ from 'lodash'

import { SeriesEvent } from '@common/event'
import { ChampEntrant, ChampResults, Entrant, Event2Points } from '@common/results'
import { UUID } from '@common/util'
import { getDObj } from '@/util/data'
import { ScorekeeperProtocol } from '..'

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
    centry.points.events[champEventKey(event)] = entry.points
}

function champEntrantFinalize(centry: ChampEntrant, bestof: number, events: SeriesEvent[]) {
    centry.points.total = calcPoints(centry.points.events, bestof)
    centry.missingrequired = events.filter(e => e.champrequire && !(champEventKey(e) in centry.points.events)).map(e => champEventKey(e))
    for (const e of events) {
        if (e.useastiebreak) {
            centry.tiebreakers.unshift(centry.points.events[champEventKey(e)] || 0)
        }
    }
    centry.tiebreakers.push(centry.eventcount)
}


export async function updatedChampResults(task: ScorekeeperProtocol): Promise<ChampResults> {
/*
    Create the cached result for champ results.
    If justeventid is None, we load all event results and create the champ results.
    If justeventid is not None, we use the previous champ results and just update the event
        (saves loading/parsing all events again)
    Returns a dict of ChampClass objects
*/
    const now       = new Date()
    const settings  = await task.series.seriesSettings()
    const classdata = await task.clsidx.getClassData()
    const events    = await task.series.eventList()
    let completed   = 0

    // Interm storage while we distribute result data by driverid
    const store = {} as {[classcode: string]: { [driverid: string]: ChampEntrant }}

    for (const event of events) {
        if (event.ispractice) continue
        if (now >= new Date(event.date)) {
            completed += 1
        }

        const eventresults = await task.results.getEventResults(event.eventid)
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

    return ret
}
