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
import { SeriesInfo } from '@common/series'
import { loadResults, needEventUpdate, needUpdate } from './base'
import { updateEventResults, updateSeriesInfo } from './calc'
import { SeriesSettings } from '@common/settings'
import { EventResults } from '@common/entrant'
import { decorateClassResults } from './decorate'


export async function cacheAll(): Promise<void> {
    const info = await getSeriesInfo()
    for (const e of info.events) {
        getEventResults(e.eventid)
        /* FINISH
        for (const c of info.getChallengesForEvent(e.eventid)) {
            getChallengeResults(c.challengeid)
        }
        */
        getChampResults()
    }
}

export async function getSeriesInfo(): Promise<SeriesInfo> {
    const name = 'info'
    if (needUpdate(false, ['challenges', 'classlist', 'indexlist', 'events', 'settings'], name)) { updateSeriesInfo(name) }
    return loadResults(name)
}


export function getEventResults(eventid: UUID) {
    if (needEventUpdate(eventid)) { updateEventResults(eventid) }
    return loadResults(eventid)
}

/*
export function getChallengeResults(challengeid) {
    if (needUpdate(true, ['challengerounds', 'challengeruns'], challengeid))
        updateChallengeResults(challengeid)
    const ret = {} // note: JSON can't store using ints as keys
    for (rnd of loadResults(challengeid)) {
        ret[rnd.round] = rnd
    }
    return ret
}
*/


export async function getChampResults() {
    /* returns a ChampClass list object */
    const name = 'champ'
    if (await needUpdate(true, ['settings', 'classlist', 'indexlist', 'events', 'cars', 'runs', 'externalresults'], name)) {
        console.log('FINISH')  // updateChampResults(name)
    }
    return loadResults(name)
    /*
    for (const [k, v] of Object.entries(res)) {
        res[k] = ChampClass(v) // Rewrap the list with ChampClass for template function
    }
    return res
    */
}

export function getTopTimesTable() {
    /* Get top times.  Pass in results from outside as in some cases, they are already loaded */
    // loadTopTimesTable(classdata, results, keys, props)
}

export function getTopTimesLists() {
    /* Get top times.  Pass in results from outside as in some cases, they are already loaded */
    // loadTopTimesTable(classdata, results, wrapInClass=TopTimesListsWrapper, props)
}

export function getDecoratedClassResults(settings: SeriesSettings, eventresults: EventResults, carids: UUID[], rungroup = 0) {
    /* Decorate the objects with old and potential results for the announcer information */
    decorateClassResults(settings, eventresults, carids, rungroup)
}

export function getDecoratedChampResults() {
    /* Decorate the objects with old and potential results for the announcer information */
    // decorateChampResults(champresults, markentrants)
}
