import { Router, Request, Response } from 'express'
import delay from 'express-delay'
import { apiget } from './apiget'
import { apipost } from './apipost'
import { login, logout, changepassword, AuthData, regreset, serieslogin, serieslogout } from './apiauth'

export const api2 = Router()

if (process.env.NODE_ENV === 'development') {
    console.log('Using development environment (fake delay and debug login)')
    api2.use(delay(500))
} else {
    console.log('Using production environment')
}

api2.use(async function(req: Request, res: Response, next: Function) {
    if (!req.session) {
        throw Error('No session available')
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

// Authenticated items
api2.post('/changepassword', changepassword)
api2.get('/', apiget)
api2.post('/', apipost)
