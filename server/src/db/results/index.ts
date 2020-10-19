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
import { decorateChampResults, decorateClassResults } from './decorate'
import { ChampEntrant, ChampResults, Entrant, EventResults, TopTimesKey, TopTimesTable } from '@common/results'
import { updateChallengeResults } from './calcchallenge'
import { updateChampResults } from './calcchamp'
import { ClassData } from '@common/classindex'
import { loadTopTimesTable } from './calctoptimes'


export async function cacheAll(): Promise<void> {
    const info = await getSeriesInfo()
    for (const e of info.events) { getEventResults(e.eventid) }
    for (const c of info.challenges) { getChallengeResults(c.challengeid) }
    getChampResults()
}

export async function getSeriesInfo(): Promise<SeriesInfo> {
    const name = 'info'
    if (needUpdate(false, ['challenges', 'classlist', 'indexlist', 'events', 'settings'], name)) { updateSeriesInfo(name) }
    return loadResults(name)
}


export async function getEventResults(eventid: UUID): Promise<EventResults> {
    if (needEventUpdate(eventid)) { updateEventResults(eventid) }
    return loadResults(eventid)
}


export async function getChallengeResults(challengeid: UUID) {
    if (needUpdate(true, ['challengerounds', 'challengeruns'], challengeid)) {
        updateChallengeResults(challengeid)
    }
    return loadResults(challengeid)
}


export async function getChampResults(): Promise<ChampResults> {
    const name = 'champ'
    if (await needUpdate(true, ['settings', 'classlist', 'indexlist', 'events', 'cars', 'runs', 'externalresults'], name)) {
        updateChampResults(name)
    }
    return loadResults(name)
}

export async function getTopTimesTable(classdata: ClassData, results: EventResults, keys: TopTimesKey[], carid?: UUID): Promise<TopTimesTable> {
    /* Get top times.  Pass in results from outside as in some cases, they are already loaded */
    return loadTopTimesTable(classdata, results, keys, carid)
}

/* FINISH IF NEEDED
export function getTopTimesLists() {
    /* Get top times.  Pass in results from outside as in some cases, they are already loaded
    // loadTopTimesTable(classdata, results, wrapInClass=TopTimesListsWrapper, props)
}
*/

export function getDecoratedClassResults(settings: SeriesSettings, eventresults: EventResults, carids: UUID[], rungroup = 0): [Entrant[], Entrant[]] {
    /* Decorate the objects with old and potential results for the announcer information */
    return decorateClassResults(settings, eventresults, carids, rungroup)
}

export function getDecoratedChampResults(champresults: ChampResults, markentrants: Entrant[]): ChampEntrant[] {
    /* Decorate the objects with old and potential results for the announcer information, single class */
    return decorateChampResults(champresults, markentrants)
}
