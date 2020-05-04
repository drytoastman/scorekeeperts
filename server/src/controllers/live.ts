import { tableWatcher, db } from '../db'
import WebSocket from 'ws'

tableWatcher.addTables(['runs', 'timertimes', 'localeventstream', 'registered'])

export const livereg = new WebSocket.Server({ noServer: true })
livereg.on('connection', function connection(ws: WebSocket) {
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
        livereg.clients.forEach(function(ws) {
            ws.send(msg)
        })
    } catch (error) {
        console.log(error)
    }
})
