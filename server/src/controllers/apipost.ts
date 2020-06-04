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
            for (const key in param.items) {
                switch (key) {
                    case 'drivers':
                        ret.drivers = await t.drivers.updateDriver(param.type, param.items.drivers, req.auth.driverId())
                        break

                    case 'unsubscribe':
                        ret.unsubscribe = await t.drivers.updateUnsubscribeList(param.items.unsubscribe, req.auth.driverId())
                        break

                    case 'cars':
                        ret.cars = await t.cars.updateCars(param.type, param.items.cars, req.auth.driverId())
                        addsummary = true
                        break

                    case 'registered':
                        Object.assign(ret, await t.register.updateRegistration(param.type, param.items.registered, param.eventid, req.auth.driverId()))
                        addsummary = true
                        break

                    case 'payments':
                        if (param.paypal) {
                            ret.payments = await paypalCapture(t, param.paypal, param.items.payments, req.auth.driverId())
                        } else if (param.square) {
                            ret.payments = await squareOrder(t, param.square, param.items.payments, req.auth.driverId())
                        }
                        addsummary = true
                        break

                    case 'paymentaccounts':
                        req.auth.requireSeries(param.series)
                        ret.paymentaccounts = await t.tx(async tx => {
                            if (param.type === 'insert') {
                                const mode = await tx.payments.getPaymentAccountCreateMode()
                                param.items.paymentaccounts.forEach(a => { a.attr.mode = mode })
                            }
                            const pa = await tx.payments.updatePaymentAccounts(param.type, param.items.paymentaccounts)
                            if ('paymentsecrets' in param.items) {  // keep in one tx as they are linked if there are errors
                                await tx.payments.updatePaymentAccountSecrets(param.type, param.items.paymentsecrets)
                            }
                            return pa
                        })
                        break

                    case 'paymentitems':
                        req.auth.requireSeries(param.series)
                        ret.paymentitems = await t.payments.updatePaymentItems(param.type, param.items.paymentitems)
                        break
                }
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
