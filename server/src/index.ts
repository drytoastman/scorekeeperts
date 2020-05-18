import express, { Request, Response } from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import cookieSession from 'cookie-session'

import { register, livereg, admin } from './controllers'

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

app.use('/api2/register', register)
app.use('/api2/admin', admin)

app.post('/wh', async(req: Request, res: Response) => {
    if (req.body.event_type === 'PAYMENT.CAPTURE.REFUNDED') {
        console.log('refund for ' + req.body.resource.id)
    } else {
        console.log('wh ' + req.body.event_type)
    }
    res.send('OK')
})

const PORT = process.env.PORT || 4000
const server = app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
})

server.on('upgrade', function upgrade(request, socket, head) {
    const pathname = request.url.split('?')[0]
    if (pathname === '/api2/register/live') {
        livereg.handleUpgrade(request, socket, head, ws => livereg.emit('connection', ws, request))
    } else {
        socket.destroy()
    }
})
