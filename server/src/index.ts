import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import cookieSession from 'cookie-session'
import WebSocket from 'ws'

import { PORT } from './config/constants'
import { register, publicsite } from './controllers'

const app = express()
app.use(helmet())
app.use(morgan('dev', {
    stream: {
        write(message: string): void {
            // eslint-disable-next-line no-console
            console.log(message.substring(0, message.lastIndexOf('\n')))
        }
    }
}))
app.use(express.json())
app.use(cookieSession({
    name: 'scorekeeper',
    secret: 'abcdefghijkl',
    maxAge: 24 * 60 * 60 * 1000
}))

app.use('/api/register', register)
app.use('/api', publicsite)

const server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is listening on port ${PORT}`)
})

const wss = new WebSocket.Server({ server })
wss.on('connection', function connection(ws: WebSocket) {
    ws.on('message', function newmessage(msg: string) {
        ws.send('response for ' + msg)
        // respond to client here
    })
    ws.send('first message')
})
