import cookieSession from 'cookie-session'
import express, { Request, Response } from 'express'
import querystring from 'querystring'
import helmet from 'helmet'
import morgan from 'morgan'
import promiseRetry from 'promise-retry'

import { api2, oldapi, live, liveStart } from './controllers'
import { db, tableWatcher, pgp } from './db'
import { startCronJobs } from './cron'
import { accesslog, mainlog } from './util/logging'

const app = express()
let cookiesessioner

app.use(helmet())
app.use(morgan('combined', {
    stream: {
        write(message: string): void {
            accesslog.info(message.substring(0, message.lastIndexOf('\n')))
        }
    }
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/public', express.static('public'))
app.use('/api2', async function(req: Request, res: Response, next: Function) {
    return res.status(503).json({ error: 'waiting for db initializtion' })
})


async function dbWaitAndApiSetup() {
    const keygrip = await promiseRetry(async function(retry, number) {
        mainlog.info('db connect, attempt number %d', number)
        try {
            return await db.general.getKeyGrip()
        } catch (error) {
            mainlog.warn(error)
            retry(error)
        }
    })

    app._router.stack.pop() // remove placeholder /api2

    cookiesessioner = cookieSession({
        name: 'scorekeeper',
        keys: keygrip,
        maxAge: 24 * 60 * 60 * 1000, // 1000 days
        sameSite: 'strict'
    })
    app.use(cookiesessioner)
    app.use(function(req, res, next) {
        // session continuation if they are active
        if (req.session) { req.session.now = Math.floor(Date.now() / 60e3) }
        next()
    })

    app.use('/api', oldapi)
    app.use('/api2', api2)

    liveStart()
    if (process.env.NODE_ENV !== 'development') {
        startCronJobs()
    }
}

dbWaitAndApiSetup()

const PORT = process.env.PORT || 4000
const server = app.listen(PORT, () => {
    mainlog.info('Server is listening on port %d', PORT)
})

server.on('upgrade', function upgrade(request, socket, head) {
    // this is outside of express so we need to parse query ourselves
    const [pathname, query] = request.url.split('?')
    request.query = querystring.parse(query)

    if (pathname.startsWith('/api2/live')) {
        cookiesessioner(request, {}, () => {}) // make sure cookie session (auth) is processed before handling
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

// Don't die if a library throws an exception the wrong way
process.on('uncaughtException', error => {
    mainlog.error('Uncaught Exception: ' + error)
})
process.on('unhandledRejection', error => {
    mainlog.error('Unhandled Rejection: ' + error)
})
