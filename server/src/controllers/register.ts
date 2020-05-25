import { Request, Response } from 'express'
import Router from 'express-promise-router'
import delay from 'express-delay'
import { db } from '../db'
import { paypalCapture } from '../util/paypal'
import { squareOrder } from '../util/square'

export const register = Router()

if (process.env.NODE_ENV === 'development') {
    console.log('Using development environment (fake delay and debug login)')
    register.use(delay(500))

    register.post('/debuglogin', async(req: Request, res: Response) => {
        req.session!.driverid = 'a08d75de-077e-11e8-9187-0242ac120002'
        res.status(200).json({ result: 'authenticated' })
    })
} else {
    console.log('Using production environment')
}

register.use(async function(req: Request, res: Response, next: Function) {
    if (!(['/login', '/regreset'].includes(req.path)) && !req.session!.driverid) {
        res.status(401).json({ result: 'login required' })
        return
    }
    next()
})

register.post('/regreset', async(req: Request, res: Response) => {
    try {
        res.json(req.body)
    } catch (error) {
        res.status(500).json({ error: error })
    }
})

register.post('/login', async(req: Request, res: Response) => {
    try {
        const driverid = await db.drivers.checkLogin(req.body.username, req.body.password)
        req.session!.driverid = driverid
        res.status(200).json({ result: 'authenticated' })
        return
    } catch (error) {
        res.status(401).json({ error: error.toString() })
    }
})

register.get('/api', async(req: Request, res: Response) => {
    const driverid = req.session && req.session.driverid
    if (!driverid) {
        res.status(400).send({ error: 'no session driver id' })
        return
    }

    res.json(await db.task('apiget', async t => {
        const ret: any = {
            type: 'get'
        }

        if (!req.query || Object.keys(req.query).length === 0) { // no requests
            ret.driver = await t.drivers.getDriverById(driverid)
            ret.serieslist = await t.series.seriesList()

        } else {
            let itemlist, classdata
            if (!('items' in req.query)) {
                itemlist = ['driver', 'serieslist', 'emaillists', 'events', 'cars', 'registered', 'payments', 'counts', 'classes', 'indexes', 'paymentaccounts', 'paymentitems']
                const serieslist = await t.series.seriesList()
                if (!serieslist.includes(req.query.series as string)) {
                    itemlist = ['driver', 'serieslist', 'emaillists']
                }
            } else {
                itemlist = (req.query.items as string).split(',')
            }

            ret.series = req.query.series
            await t.series.setSeries(ret.series)
            for (let ii = 0; ii < itemlist.length; ii++) {  // forEach/async don't play nice
                switch (itemlist[ii]) {
                    case 'driver':     ret.driver     = await t.drivers.getDriverById(driverid); break
                    case 'serieslist': ret.serieslist = await t.series.seriesList(); break
                    case 'emaillists':
                        ret.listids     = await t.series.emailListIds()
                        ret.unsubscribe = await t.drivers.getUnsubscribeList(driverid)
                        break
                    case 'events':     ret.events     = await t.series.eventList(); break
                    case 'cars':       ret.cars       = await t.cars.getCarsbyDriverId(driverid); break
                    case 'registered': ret.registered = await t.register.getRegistrationbyDriverId(driverid); break
                    case 'payments':   ret.payments   = await t.payments.getPaymentsbyDriverId(driverid); break
                    case 'counts':     ret.counts     = await t.register.getRegistationCounts(); break
                    case 'classes':
                    case 'indexes':
                        if (!classdata) classdata = await t.clsidx.classData()
                        ret[itemlist[ii]] = classdata[itemlist[ii]]
                        break
                    case 'paymentaccounts':
                        ret.paymentaccounts = await t.payments.getPaymentAccounts()
                        break
                    case 'paymentitems':
                        ret.paymentitems = await t.payments.getPaymentItems()
                        break
                    default: console.log(`don't understand ${itemlist[ii]}`); break
                }
            }
        }
        return ret
    }))
})

register.post('/api', async(req: Request, res: Response) => {
    if (!('series' in req.body && 'type' in req.body)) {
        res.status(400).send({ error: 'missing series or type' })
        console.log(req.body)
        return
    }

    const driverid = req.session && req.session.driverid
    if (!driverid) {
        res.status(400).send({ error: 'no session driver id' })
        return
    }

    try {
        res.json(await db.task('apipost', async t => {
            const ret: any = {
                type: req.body.type,
                series: req.body.series
            }

            await t.series.setSeries(req.body.series)
            if ('driver' in req.body) {
                ret.driver = await t.drivers.updateDriver(req.body.type, req.body.driver, driverid)
            }
            if ('cars' in req.body) {
                ret.cars = await t.cars.updateCars(req.body.type, req.body.cars, driverid)
            }
            if ('registered' in req.body) {
                Object.assign(ret, await t.register.updateRegistration(req.body.type, req.body.registered, req.body.eventid, driverid))
            }
            if ('payments' in req.body) {
                if ('paypal' in req.body) {
                    ret.payments = await paypalCapture(t, req.body.paypal, req.body.payments, driverid)
                } else if ('square' in req.body) {
                    ret.payments = await squareOrder(t, req.body.square, req.body.payments, driverid)
                }
            }

            return ret
        }))
    } catch (error) {
        res.status(400).send({ error: error.toString() })
    }
})

register.get('/used', async(req: Request, res: Response) => {
    if (!('series' in req.query && 'classcode' in req.query)) {
        res.status(400).send({ error: 'missing series or classcode ' + JSON.stringify(req.query) })
        return
    }

    await db.series.setSeries(req.query.series as string)
    const ret = await db.register.usedNumbers(req.session!.driverid, req.query.classcode as string, await db.series.superUniqueNumbers())
    res.json(ret)
})

register.get('/logout', async(req: Request, res: Response) => {
    req.session!.driverid = null
    res.status(200).json({ result: 'logged out' })
})
