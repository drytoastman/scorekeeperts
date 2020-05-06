/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Request, Response } from 'express'
import Router from 'express-promise-router'
import delay from 'express-delay'
import { db } from '../db'

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
        const d = await db.drivers.getDriverbyUsername(req.body.username)
        const success = await db.drivers.checkPassword(d, req.body.password)
        if (success) {
            req.session!.driverid = d.driverid
            res.status(200).json({ result: 'authenticated' })
            return
        }
    } catch (error) {
    }
    res.status(401).json({ error: 'authentication failed' })
})

register.get('/api', async(req: Request, res: Response) => {
    res.json(await db.task('apiget', async t => {
        const ret: any = {
            type: 'get'
        }

        if (!req.query || Object.keys(req.query).length === 0) { // no requests
            ret.driver = await t.drivers.getDriverById(req.session!.driverid)
            ret.serieslist = await t.series.seriesList()

        } else {
            let itemlist, classdata
            if (!('items' in req.query)) {
                itemlist = ['events', 'cars', 'registered', 'payments', 'counts', 'classes', 'indexes']
            } else {
                itemlist = (req.query.items as string).split(',')
            }

            ret.series = req.query.series
            await t.series.setSeries(ret.series)
            for (let ii = 0; ii < itemlist.length; ii++) {  // forEach/async don't play nice
                switch (itemlist[ii]) {
                case 'driver':     ret.driver     = await t.drivers.getDriverById(req.session!.driverid); break
                case 'events':     ret.events     = await t.series.eventList(); break
                case 'cars':       ret.cars       = await t.cars.getCarsbyDriverId(req.session!.driverid); break
                case 'registered': ret.registered = await t.register.getRegistrationbyDriverId(req.session!.driverid); break
                case 'payments':   ret.payments   = await t.register.getPaymentsbyDriverId(req.session!.driverid); break
                case 'counts':     ret.counts     = await t.register.getRegistationCounts(); break
                case 'classes':
                case 'indexes':
                    if (!classdata) classdata = await t.clsidx.classData()
                    ret[itemlist[ii]] = classdata[itemlist[ii]]
                    break
                    // eslint-disable-next-line no-console
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
        return
    }

    try {
        const ret: any = {
            type: req.body.type,
            series: req.body.series
        }

        await db.series.setSeries(req.body.series)
        if ('cars' in req.body) {
            ret.cars = await db.cars.updateCars(req.body.type, req.body.cars, req.session!.driverid)
        }
        if ('registered' in req.body) {
            ret.registered = await db.register.updateRegistration(req.body.type, req.body.registered, req.session!.driverid)
        }

        res.json(ret)
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
