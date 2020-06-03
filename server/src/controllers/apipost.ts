import { Request, Response } from 'express'
import { db } from '../db'
import { allSeriesSummary } from './summary'
import { squareOrder } from '../util/square'
import { paypalCapture } from '../util/paypal'
import { checkAuth } from './apiauth'
import _ from 'lodash'

export async function apipost(req: Request, res: Response) {

    let param
    try {
        param = checkAuth(req)
    } catch (error) {
        res.status(401).json({ error: error.message, types: error.types })
        return
    }

    try {
        res.json(await db.task('apipost', async t => {
            const ret: any = {
                type: param.type,
                series: param.series
            }
            let addsummary = false

            await t.series.setSeries(param.series)
            if ('drivers' in param.items) {
                ret.drivers = await t.drivers.updateDriver(param.type, param.items.drivers, req.auth.driverId())
            }
            if ('unsubscribe' in param.items) {
                ret.unsubscribe = await t.drivers.updateUnsubscribeList(param.items.unsubscribe, req.auth.driverId())
            }
            if ('cars' in param.items) {
                ret.cars = await t.cars.updateCars(param.type, param.items.cars, req.auth.driverId())
                addsummary = true
            }
            if ('registered' in param.items) {
                Object.assign(ret, await t.register.updateRegistration(param.type, param.items.registered, param.eventid, req.auth.driverId()))
                addsummary = true
            }
            if ('payments' in param.items) {
                if (param.paypal) {
                    ret.payments = await paypalCapture(t, param.paypal, param.items.payments, req.auth.driverId())
                } else if (param.square) {
                    ret.payments = await squareOrder(t, param.square, param.items.payments, req.auth.driverId())
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
