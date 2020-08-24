import { Router, Request, Response } from 'express'
import delay from 'express-delay'
import { apiget } from './apiget'
import { apipost } from './apipost'
import { login, logout, changepassword, AuthData, serieslogin, adminlogin, adminlogout } from './apiauth'
import { regreset } from './regreset'
import { controllog } from '../util/logging'
import { cards } from './cards'
import { logs } from './logs'

export const api2 = Router()

if (process.env.NODE_ENV === 'development') {
    controllog.warn('Using development environment (fake delay and debug login)')
    api2.use(delay(500))
} else {
    controllog.info('Using production environment')
}

api2.use(async function(req: Request, res: Response, next: Function) {
    if (!req.session) {
        return res.status(500).json({ error: 'no session available' })
    }
    req.auth = new AuthData(req.session)
    next()
})

// items where we don't care about being pre authenticated
api2.post('/login', login)
api2.get('/logout', logout)
api2.post('/regreset', regreset)
api2.post('/serieslogin', serieslogin)
api2.post('/adminlogin', adminlogin)
api2.get('/adminlogout', adminlogout)

// Authenticated items
api2.get('/', apiget)
api2.get('/cards', cards)
api2.get('/logs', logs)
api2.post('/', apipost)
api2.post('/changepassword', changepassword)
