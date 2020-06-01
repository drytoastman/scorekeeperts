import { Request, Response } from 'express'
import { db } from '../db'
import { allSeriesSummary } from './summary'
import { squareOrder } from '../util/square'
import { paypalCapture } from '../util/paypal'
import { checkAuthItems } from './apiauth'
import _ from 'lodash'

export async function apipost(req: Request, res: Response) {

    if (!('series' in req.body && 'type' in req.body)) {
        res.status(400).send({ error: 'missing series or type' })
        return
    }

    // extract argument pieces before authorizing operations
    const type    = req.body.type
    const eventid = req.body.eventid
    const series  = req.body.series
    const paypal  = req.body.paypal
    const square  = req.body.square

    let data
    try {
        data = _.pick(req.body, checkAuthItems(Object.keys(req.body), series, req.auth))
    } catch (error) {
        res.status(401).json({ error: error.message, types: error.types })
        return
    }

    try {
        res.json(await db.task('apipost', async t => {
            const ret: any = {
                type: type,
                series: series
            }
            let addsummary = false

            await t.series.setSeries(series)
            if ('driver' in data) {
                ret.driver = await t.drivers.updateDriver(type, data.driver, req.auth.driverId())
            }
            if ('unsubscribe' in data) {
                ret.unsubscribe = await t.drivers.updateUnsubscribeList(data.unsubscribe, req.auth.driverId())
            }
            if ('cars' in data) {
                ret.cars = await t.cars.updateCars(type, data.cars, req.auth.driverId())
                addsummary = true
            }
            if ('registered' in data) {
                Object.assign(ret, await t.register.updateRegistration(type, data.registered, eventid, req.auth.driverId()))
                addsummary = true
            }
            if ('payments' in data) {
                if (paypal) {
                    ret.payments = await paypalCapture(t, paypal, data.payments, req.auth.driverId())
                } else if (square) {
                    ret.payments = await squareOrder(t, square, data.payments, req.auth.driverId())
                }
                addsummary = true
            }

            if (addsummary) {
                ret.summary = await allSeriesSummary(t, req.auth.driverId())
            }
            return ret
        }))
    } catch (error) {
        res.status(400).send({ error: error.toString() })
    }
}
