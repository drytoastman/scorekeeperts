import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import cookieSession from 'cookie-session'

import { api2, live } from './controllers'
import { db, tableWatcher, pgp } from './db'
import { startCronJobs } from './cron'
import { mainlog } from './util/logging'

if (process.env.NODE_ENV !== 'development') {
    startCronJobs()
}

const app = express()
app.use(helmet())
app.use(morgan('dev', {
    stream: {
        write(message: string): void {
            mainlog.info(message.substring(0, message.lastIndexOf('\n')))
        }
    }
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

db.general.getKeyGrip().then(keygrip => {
    app.use(cookieSession({
        name: 'scorekeeper',
        keys: keygrip,
        maxAge: 24 * 60 * 60 * 1000, // 1000 days
        sameSite: 'strict'
    }))
    app.use(function(req, res, next) {
        // session continuation if they are active
        if (req.session) { req.session.now = Math.floor(Date.now() / 60e3) }
        next()
    })

    app.use('/api2', api2)
    app.use('/public', express.static('public'))
}).catch(error => {
    mainlog.error(`Unable to load keys (${error}), sessions will not work`)
})

const PORT = process.env.PORT || 4000
const server = app.listen(PORT, () => {
    mainlog.info('Server is listening on port %d', PORT)
})

server.on('upgrade', function upgrade(request, socket, head) {
    const pathname = request.url.split('?')[0]
    if (pathname === '/api2/live') {
        live.handleUpgrade(request, socket, head, ws => live.emit('connection', ws, request))
    } else {
        socket.destroy()
    }
})


process.on('SIGTERM', () => {
    mainlog.warn('terminating')
    server.close(() => {
        tableWatcher.shutdown()
        pgp.end()
        process.exitCode = 0
    })
})

process.on('uncaughtException', function(err) {
    // Don't die if a library throws an exception the wrong way
    console.log('Uncaught exception: ' + err)
})
