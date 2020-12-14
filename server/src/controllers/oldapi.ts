import _ from 'lodash'
import { Router } from 'express'

import { db } from '@scdb'
import { controllog } from '@/util/logging'
import { ChampEntrant, Entrant } from '@sctypes/results'

export const oldapi = Router()

oldapi.get('/', (req, res, next) => {
    db.task(async t => {
        return res.json(await t.series.allSeries())
    }).catch(next)
})

oldapi.get('/:series', (req, res, next) => {
    db.task(async t => {
        const series = req.params.series
        await t.series.setSeries(series)
        return res.json(await t.results.getSeriesInfo())
    }).catch(next)
})

function formatClassResults(code: string, data: Entrant[]) {
    const ret = {
        classcode: code,
        entries: data as any
    }
    for (const r of ret.entries) { r.runs = _.flatten(r.runs) }
    return ret
}

oldapi.get('/:series/event/:eventid', (req, res, next) => {
    db.task(async t => {
        const series  = req.params.series
        const eventid = req.params.eventid
        await t.series.setSeries(series)
        return res.json({
            eventid: eventid,
            classes: Object.entries(await t.results.getEventResults(eventid)).map(([k, v]) => formatClassResults(k, v))
        })
    }).catch(next)
})

oldapi.get('/:series/event/:eventid/:classcode', (req, res, next) => {
    db.task(async t => {
        const series    = req.params.series
        const eventid   = req.params.eventid
        const classcode = req.params.classcode
        await t.series.setSeries(series)
        return res.json(formatClassResults(classcode, (await t.results.getEventResults(eventid))[classcode]))
    }).catch(next)
})


function formatClassChampResults(code: string, data: ChampEntrant[]) {
    const ret = {
        classcode: code,
        entries: data as any[]
    }

    for (const r of ret.entries) {
        r.events = []
        for (const [d1, p1] of Object.entries(r.points.events)) {
            r.events.push({
                eventdate: d1.slice(2),
                points: p1,
                drop: d1 in r.points.drop
            })
        }
        r.points = r.points.total
    }
    return ret
}

oldapi.get('/:series/champ', (req, res, next) => {
    db.task(async t => {
        const series = req.params.series
        await t.series.setSeries(series)
        return res.json({
            series:  series,
            classes: Object.entries(await t.results.getChampResults()).map(([k, v]) => formatClassChampResults(k, v))
        })
    }).catch(next)
})

oldapi.get('/:series/champ/:classcode', (req, res, next) => {
    db.task(async t => {
        const series    = req.params.series
        const classcode = req.params.classcode
        await t.series.setSeries(series)
        return res.json(formatClassChampResults(classcode, (await t.results.getChampResults())[classcode]))
    }).catch(next)
})


function formatChallengeResults(round: string, data: any) {
    if (!data || parseInt(round) <= 0) return {}
    data.top    = data.e1
    data.bottom = data.e2
    delete data.e1
    delete data.e2
    switch (data.winner) {
        case 1: data.winner  = 'top';    break
        case 2: data.winner  = 'bottom'; break
        default: data.winner = undefined
    }
    return data
}

oldapi.get('/:series/challenge/:challengeid', (req, res, next) => {
    db.task(async t => {
        const series      = req.params.series
        const challengeid = req.params.challengeid
        await t.series.setSeries(series)
        return res.json({
            challengeid: challengeid,
            rounds: [Object.entries(await t.results.getChallengeResults(challengeid)).map(([k, v]) => formatChallengeResults(k, v))]
        })
    }).catch(next)
})

oldapi.get('/:series/challenge/:challengeid/:round', (req, res, next) => {
    db.task(async t => {
        const series      = req.params.series
        const challengeid = req.params.challengeid
        const round       = req.params.round
        await t.series.setSeries(series)
        return res.json(formatChallengeResults(round, (await t.results.getChallengeResults(challengeid))[round]))
    }).catch(next)
})

oldapi.get('/:series/scca/:eventid', (req, res, next) => {
    function desc(e: any): string { return `${e.year} ${e.make} ${e.model} ${e.color}` }

    db.task(async t => {
        const series  = req.params.series
        const eventid = req.params.eventid
        await t.series.setSeries(series)
        const results = await t.results.getEventResults(eventid)

        // dump but simple way to encode our stuff
        const lines = [] as string[]
        lines.push('<Entries>')
        for (const cls in results) {
            for (const res of results[cls]) {
                lines.push('<Entry>')
                lines.push(`<CarModel>${desc(res)}</CarModel>`)
                lines.push(`<CarNo>${res.number}</CarNo>`)
                lines.push(`<Class>${res.classcode}</Class>`)
                lines.push(`<FirstName>${res.firstname}</FirstName>`)
                lines.push(`<LastName>${res.lastname}</LastName>`)
                lines.push(`<MemberNo>${res.scca || ''}</MemberNo>`)
                lines.push(`<Pos>${res.position}</Pos>`)
                lines.push(`<TotalTm>${res.net.toFixed(3)}</TotalTm>`)
                lines.push('</Entry>')
            }
        }
        lines.push('</Entries>')

        res.type('text/xml')
        return res.send(lines.join(''))
    }).catch(next)
})

oldapi.use((error, req, res, next) => {
    res.status(500).send({ error: error.message })
    controllog.error(error)
    next()
})
