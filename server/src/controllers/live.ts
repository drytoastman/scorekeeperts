import { tableWatcher, db } from '../db'
import WebSocket from 'ws'

tableWatcher.addTables(['runs', 'timertimes', 'localeventstream', 'registered', 'events'])

export const live = new WebSocket.Server({ noServer: true })

live.on('connection', function connection(ws: WebSocket) {
    ws.on('message', function newmessage(msg: string) {
        ws.send('pong')
    })
})

tableWatcher.on('registered', async function change(series: any) {
    try {
        const res = await db.task('apiget', async t => {
            await t.series.setSeries(series)
            return t.register.getRegistationCounts()
        })
        const msg = JSON.stringify({
            type: 'update',
            series: series,
            counts: res
        })
        live.clients.forEach(function(ws) {
            ws.send(msg)
        })
    } catch (error) {
        console.log(error)
    }
})

tableWatcher.on('events', async function change(series: any) {
    try {
        const res = await db.task('apiget', async t => {
            await t.series.setSeries(series)
            return t.series.eventList()
        })
        const msg = JSON.stringify({
            type: 'get',
            series: series,
            events: res
        })
        live.clients.forEach(function(ws) {
            ws.send(msg)
        })
    } catch (error) {
        console.log(error)
    }
})
