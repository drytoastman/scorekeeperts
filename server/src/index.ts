import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import cookieSession from 'cookie-session'
import url from 'url'

import { PORT } from './config/constants'
import { register, publicsite, livews } from './controllers'

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
    console.log(`Server is listening on port ${PORT}`)
})

server.on('upgrade', function upgrade(request, socket, head) {
    const pathname = request.url.split('?')[0]
    if (pathname === '/live2') {
        livews.handleUpgrade(request, socket, head, function done(ws) {
            livews.emit('connection', ws, request)
        })
    } else {
        socket.destroy()
    }
})
