import { tableWatcher } from '../db'
import WebSocket from 'ws'

export const livews = new WebSocket.Server({ noServer: true })
livews.on('connection', function connection(ws: WebSocket) {
    ws.on('message', function newmessage(msg: string) {
        ws.send('response for ' + msg)
        // respond to client here
    })
    ws.send('first message')
})

tableWatcher.addTables(['runs', 'timertimes', 'localeventstream', 'registered'])

tableWatcher.on('registered', function change(schema: any) {
    livews.clients.forEach(function(ws) {
        ws.send(`table change registered on schema ${schema}`)
    })
    // console.log(`table change registered on schema ${schema}`)
})
