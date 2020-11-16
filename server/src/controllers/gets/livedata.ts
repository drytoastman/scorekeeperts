import _ from 'lodash'
import { LiveSocketWatch, Run, TopTimesKey } from '@/common/results'
import { UUID } from '@/common/util'
import { db } from '@/db'
import { createTopTimesTable } from '@/common/toptimes'
import { getDObj } from '@/common/data'
import { LazyData } from '../lazydata'

export async function generateProTimer(): Promise<string> {
    const limit  = 30
    const events = await db.any('SELECT * FROM localeventstream ORDER BY time DESC LIMIT $1', [limit])

    if (!events) return ''
    events.reverse()

    const record = [[] as any[], [] as any[]]
    for (const ev of events) {
        if (ev.etype === 'TREE') {
            record[0].push({})
            record[1].push({})

        } else if (ev.etype === 'RUN') {
            const d = ev.event.data
            const fmt = {
                rowid:    d.rowid,
                reaction: d.attr.reaction || '',
                sixty:    d.attr.sixty || '',
                status:   d.status || '',
                raw:      d.raw || 'NaN'
            }

            const cindex = d.course - 1
            let found = false
            for (const r of record[cindex])  {
                if (r.rowid === fmt.rowid) {
                    Object.assign(r, fmt)
                    found = true
                    break
                }
            }

            if (!found && record[cindex].length > 0) {
                const lidx = record[cindex].length - 1
                const last = record[cindex][lidx]
                Object.assign(last, fmt)
            }
        }
    }

    return JSON.stringify({
        protimer: {
            left:  record[0].slice(-3),
            right: record[1].slice(-3)
        }
    })
}


export async function loadResultData(lazy: LazyData, watch: LiveSocketWatch, row: Run&{classcode:string}) {
    const event = await lazy.getEvent(row.eventid)
    let data
    if (event.ispro) {
        // Get both this row entrant and the last run on the opposite course with the same classcode
        const back = new Date(row.modified); back.setSeconds(-60)
        const opp  = await lazy.lastRun(row.eventid, back, row.classcode, row.course === 1 ? 2 : 1)
        data = await loadEventResults(lazy, watch, row, opp ? opp.carid : undefined, row.classcode)
    } else {
        data = await loadEventResults(lazy, watch, row)
    }

    data.timestamp = row.modified
    return data
}

/**
 * Load Event results based on the last run data
 * @param lazy the LazyData instance
 * @param watch the requested result items to watch for
 * @param lastrun the last run data
 * @param oppcarid optional carid to lookup on the opposite course (for ProSolo)
 */
export async function loadEventResults(lazy: LazyData, watch: LiveSocketWatch, lastrun: Run, oppcarid?:UUID, classcodefilter?: string) {
    const data      = {} as any
    const carids    = [lastrun.carid]

    if (oppcarid) carids.push(oppcarid)
    data.last = await loadEntrantResults(lazy, watch, lastrun.eventid, carids, lastrun.rungroup)

    for (const type in watch.top) {
        getDObj(data, 'top')[type] = {}
        for (const course in watch.top[type]) {
            if (watch.top[type][course]) {
                data.top[type][course] = createTopTimesTable(
                    await lazy.classdata(),
                    await lazy.eresults(lastrun.eventid),
                    [new TopTimesKey({ indexed: type === 'net', counted: type === 'net', course: course })],
                    lastrun.carid
                )
            }
        }
    }

    if (watch.runorder) {
        data.runorder =  {
            course: lastrun.course,
            run: lastrun.run,
            next: await lazy.nextorder(lastrun.eventid, lastrun.course, lastrun.rungroup, lastrun.carid)
        }
    }

    if (watch.next) {
        const nextids = await lazy.nextorder(lastrun.eventid, lastrun.course, lastrun.rungroup, lastrun.carid, classcodefilter)
        if (nextids && nextids.length) {
            data.next = await loadEntrantResults(lazy, watch, lastrun.eventid, [nextids[0].carid], lastrun.rungroup)
        }
    }

    return data
}

export async function loadEntrantResults(lazy: LazyData, watch: LiveSocketWatch, eventid: UUID, carids: UUID[], rungroupfilter?: number) {
    const ret = {} as any
    if (!carids || carids.length <= 0) return ret

    const [group, drivers] = await lazy.event(eventid, carids, rungroupfilter)
    if (!drivers) return ret

    const classcode = drivers[0].classcode

    if (watch.entrant) ret.entrant = drivers[0]
    if (watch.class)   ret.class   = { classcode: classcode, order: group }
    if (watch.champ && !(await lazy.getEvent(eventid)).ispractice && (await lazy.classdata()).classlist[classcode].champtrophy) {
        ret.champ = {
            classcode: classcode,
            order: await lazy.champ(drivers)
        }
    }

    return ret
}
