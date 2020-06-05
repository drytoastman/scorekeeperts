import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import cookieSession from 'cookie-session'

import { api2, live } from './controllers'
import { db } from './db'
import { paypalCheckRefunds } from './util/paypal'

const app = express()
app.use(helmet())
app.use(morgan('dev', {
    stream: {
        write(message: string): void {
            console.log(message.substring(0, message.lastIndexOf('\n')))
        }
    }
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieSession({
    name: 'scorekeeper',
    secret: 'abcdefghijkl',
    maxAge: 24 * 60 * 60 * 1000
}))
app.use(function(req, res, next) {
    // session continuation if they are active
    if (req.session) { req.session.now = Math.floor(Date.now() / 60e3) }
    next()
})

app.use('/api2', api2)
app.get('/test1', function(req, res) {
    db.task(async t => {
        t.series.setSeries(req.query.series as string)
        const a = await t.payments.getPaymentAccount(req.query.accountid as string)
        res.json(await paypalCheckRefunds(t, a))
    }).catch(error => {
        res.json(error)
    })
})


const PORT = process.env.PORT || 4000
const server = app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
})

server.on('upgrade', function upgrade(request, socket, head) {
    const pathname = request.url.split('?')[0]
    if (pathname === '/api2/live') {
        live.handleUpgrade(request, socket, head, ws => live.emit('connection', ws, request))
    } else {
        socket.destroy()
    }
})
