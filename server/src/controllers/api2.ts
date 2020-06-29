import { Router, Request, Response } from 'express'
import delay from 'express-delay'
import { apiget } from './apiget'
import { apipost } from './apipost'
import { login, logout, changepassword, AuthData, regreset, serieslogin, serieslogout, adminlogin, adminlogout } from './apiauth'
import { controllog } from '../util/logging'

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
api2.post('/serieslogout', serieslogout)
api2.post('/adminlogin', adminlogin)
api2.post('/adminlogout', adminlogout)

// Authenticated items
api2.post('/changepassword', changepassword)
api2.get('/', apiget)
api2.post('/', apipost)
