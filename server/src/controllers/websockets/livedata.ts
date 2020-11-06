import { SeriesStatus } from '@/common/series'
import { db, tableWatcher } from '@/db'
import { intersect } from '@/util/data'
import { websockets } from '.'
import { SessionWebSocket } from './types'

const watchValid = new Set(['entrant', 'class', 'champ', 'next', 'topnet', 'topraw', 'runorder', 'timer', 'protimer'])
export async function processLiveRequest(ws: SessionWebSocket, data: any) {
    websockets.clearLive(ws)
    if (await db.series.getStatus(data.series) !== SeriesStatus.ACTIVE) {
        return ws.send(JSON.stringify({ error: 'not an active series' }))
    }

    const watch = new Set<String>(data.watch)
    if (intersect(watch, watchValid).size > 0) {
        ws.watch  = watch
        ws.series = data.series
        ws.last   = new Date(0)
        websockets.addLive(ws)
        // fire off current data now!

        for (const item of ws.watch) {
            switch (item) {
                case 'protimer': sendProTimer([ws], data.series); break
            }
        }
    }
}


tableWatcher.on('timertimes', (series: string, type: string, row: any) => {
    const msg = JSON.stringify({ timer: row.raw })
    websockets.getAllLive('timer').forEach(ws => ws.send(msg))
})

tableWatcher.on('localeventstream', (series: string, type: string, row: any) => {
    const rx = websockets.getLive(series, 'protimer')
    if (rx.length > 0) {
        sendProTimer(rx, series)
    }
})

tableWatcher.on('runs', (series: string, type: string, row: any) => {
})


async function sendProTimer(list: SessionWebSocket[], series: string) {
    const limit  = 30
    const events = await db.task(async t => {
        await t.series.setSeries(series)
        return await t.any('SELECT * FROM localeventstream ORDER BY time DESC LIMIT $1', [limit])
    })

    if (!events) return
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

    const msg = JSON.stringify({
        protimer: {
            left:  record[0].slice(-3),
            right: record[1].slice(-3)
        }
    })

    list.forEach(ws => ws.send(msg))
}
