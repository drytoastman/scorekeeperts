import { Request, Response } from 'express'
import { db } from '../db'
import { allSeriesSummary, allSeriesCars, allSeriesDeleteDriverLinks } from './allseries'
import * as square from '../util/square'
import { paypalCapture } from '../util/paypal'
import { checkAuth } from './apiauth'
import _ from 'lodash'
import { Car } from '@common/car'

export async function apipost(req: Request, res: Response) {

    let param
    try {
        param = checkAuth(req)
    } catch (error) {
        res.status(401).json({ error: error.message, types: error.types })
        return
    }

    function assertIsDriver(authtype) {
        if (!(authtype === 'driver')) {
            throw new Error('Driver auth required for this request')
        }
    }

    try {
        res.json(await db.tx('apipost', async t => {
            const ret: any = {
                type: param.type,
                series: param.series
            }
            let addsummary = false
            let dids

            await t.series.setSeries(param.series)
            const isSeries = ['series', 'admin'].includes(param.authtype)
            const verifyDriverId = (param.authtype === 'driver') ? req.auth.driverId() : param.driverid

            for (const key in param.items) {
                switch (key) {
                    case 'drivers':
                        if (param.type === 'delete') {
                            await allSeriesDeleteDriverLinks(t, param.items.drivers.map(d => d.driverid))
                            await t.series.setSeries(param.series)
                        }
                        ret.drivers = await t.drivers.updateDriver(param.type, param.items.drivers, (param.authtype === 'driver') ? req.auth.driverId() : null)
                        break

                    case 'cars':
                        ret.cars = await t.cars.updateCars(param.type, param.items.cars, verifyDriverId)
                        if (isSeries) { // append series/activity that it normally gets for admin site
                            for (const c of ret.cars) {
                                await t.cars.getActivityForCar(c)
                                c.series = param.series
                            }
                        }
                        addsummary = true
                        break

                    case 'registered':
                        Object.assign(ret, await t.register.updateRegistration(param.type, param.items.registered, param.eventid, verifyDriverId))
                        addsummary = true
                        break

                    case 'unsubscribe':
                        ret.unsubscribe = await t.drivers.updateUnsubscribeList(param.items.unsubscribe, verifyDriverId)
                        break

                    case 'payments':
                        if (param.paypal) {
                            assertIsDriver(param.authtype)
                            ret.payments = await paypalCapture(t, param.paypal, param.items.payments, verifyDriverId)
                        } else if (param.square) {
                            assertIsDriver(param.authtype)
                            ret.payments = await square.squareOrder(t, param.square, param.items.payments, verifyDriverId)
                        } else {
                            req.auth.requireSeries(param.series)
                            ret.payments = await t.payments.updatePayments(param.type, param.items.payments)
                        }
                        addsummary = true
                        break

                    case 'refund':
                        req.auth.requireSeries(param.series)
                        ret.payments = await square.squareRefund(t, param.items.refund)
                        break

                    case 'paymentaccounts':
                        req.auth.requireSeries(param.series)
                        ret.paymentaccounts = await t.tx(async tx => {
                            const pa = await tx.payments.updatePaymentAccounts(param.type, param.items.paymentaccounts)
                            if ('paymentsecrets' in param.items) {  // keep in one transaction as they are linked if there are errors
                                await tx.payments.updatePaymentAccountSecrets(param.type, param.items.paymentsecrets)
                            }
                            return pa
                        })
                        break

                    case 'paymentitems':
                        req.auth.requireSeries(param.series)
                        ret.paymentitems = await t.payments.updatePaymentItems(param.type, param.items.paymentitems)
                        break

                    case 'squareoauthcode':
                        req.auth.requireSeries(param.series)
                        ret.squareoauthresp = await square.squareoAuthRequest(t, param.series, param.items.squareoauthcode)
                        break
                    case 'squareoauthlocation':
                        req.auth.requireSeries(param.series)
                        await square.squareoAuthFinish(t, param.items.squareoauthlocation.requestid, param.items.squareoauthlocation.locationid)
                        ret.type = 'get'
                        ret.paymentaccounts = await t.payments.getPaymentAccounts()
                        break

                    case 'settings':
                        req.auth.requireSeries(param.series)
                        ret.settings = await t.series.updateSettings(param.items.settings)
                        break

                    case 'classes':
                        req.auth.requireSeries(param.series)
                        ret.classes = await t.clsidx.updateClasses(param.type, param.items.classes)
                        break

                    case 'indexes':
                        req.auth.requireSeries(param.series)
                        ret.indexes = await t.clsidx.updateIndexes(param.type, param.items.indexes)
                        break

                    case 'events':
                        req.auth.requireSeries(param.series)
                        ret.events = await t.series.updateEvents(param.type, param.items.events)
                        break

                    case 'carids':
                        req.auth.requireSeries(param.series)
                        ret.cars = await t.cars.getCarsById(param.items.carids)
                        param.items.driverids = Array.from(new Set([...param.items.driverids, ...ret.cars.map((c:Car) => c.driverid)]))
                        break

                    case 'notcarids':
                        req.auth.requireSeries(param.series)
                        ret.cars = await t.cars.getCarsByNotId(param.items.notcarids)
                        dids = new Set(ret.cars.map((c:Car) => c.driverid))
                        for (const did of param.items.notdriverids) {
                            dids.delete(did)
                        }
                        param.items.driverids = Array.from(dids)
                        break

                    case 'localsettings':
                        req.auth.requireAdmin()
                        ret.localsettings = await t.general.updateLocalSettings(param.items.localsettings)
                        break

                    case 'rotatekeygrip':
                        req.auth.requireAdmin()
                        await t.general.rotateKeyGrip()
                        break

                    case 'editorids':
                        ret.drivers = await t.drivers.getDriversById(param.items.editorids)
                        ret.cars = await allSeriesCars(t, param.items.editorids)
                        await t.series.setSeries(param.series)  // restore series
                        break
                }
            }

            if (param.items && 'driverids' in param.items) {
                // if user or other items requested these (do this outside switch for order)
                req.auth.requireSeries(param.series)
                ret.drivers = await t.drivers.getDriversById(param.items.driverids)
            }

            if (addsummary && param.authtype === 'driver') {
                ret.summary = await allSeriesSummary(t, verifyDriverId)
            }

            return ret
        }))
    } catch (error) {
        res.status(500).send({ error: error.toString() })
    }
}
