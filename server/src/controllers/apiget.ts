import { Request, Response } from 'express'
import { db } from '../db'
import { allSeriesSummary } from './summary'
import { checkAuth } from './apiauth'

export async function apiget(req: Request, res: Response) {

    let param
    try {
        param = checkAuth(req)
    } catch (error) {
        res.status(401).json({ error: error.message, authtype: error.authtype })
        return
    }

    res.json(await db.task('apiget', async t => {
        const ret: any = {
            type: 'get',
            series: param.series
        }

        let classdata
        const isSeries = param.authtype === 'series'
        await t.series.setSeries(ret.series)
        for (const item of param.items) {
            switch (item) {
                case 'serieslist':  ret.serieslist  = await t.series.seriesList(); break
                case 'listids':     ret.listids     = await t.series.emailListIds(); break
                case 'events':      ret.events      = await t.series.eventList(); break
                case 'counts':      ret.counts      = await t.register.getRegistationCounts(); break
                case 'classes':     ret.classes     = await t.clsidx.classList(); break
                case 'indexes':     ret.indexes     = await t.clsidx.indexList(); break
                case 'paymentitems': ret.paymentitems = await t.payments.getPaymentItems(); break
                case 'paymentaccounts': ret.paymentaccounts = await t.payments.getPaymentAccounts(); break

                // dependent on auth type
                case 'drivers':
                    ret.drivers = await (isSeries
                        ? t.drivers.getAllDrivers()
                        : t.drivers.getDriversById([req.auth.driverId()]))
                    break

                case 'unsubscribe':
                    ret.driverunsubscribe = await (isSeries
                        ? ['fix me someday']
                        : t.drivers.getUnsubscribeByDriverId(req.auth.driverId()))
                    break

                case 'payments':
                    ret.payments = await (isSeries
                        ? t.payments.getAllPayments(param.eventid)
                        : t.payments.getPaymentsbyDriverId(req.auth.driverId()))
                    break

                case 'registered':
                    ret.registered = await (isSeries
                        ? t.register.getAllRegistration(param.eventid)
                        : t.register.getRegistrationbyDriverId(req.auth.driverId()))
                    break

                case 'cars':
                    ret.cars = await (isSeries
                        ? t.cars.getAllCars()
                        : t.cars.getCarsbyDriverId(req.auth.driverId()))
                    break

                case 'summary':
                    break // deal with later

                case 'squareapplicationid': ret.squareapplicationid = await t.payments.getSquareApplicationId(); break
                case 'usednumbers':
                    ret.usednumbers = await t.register.usedNumbers(req.auth.driverId(), param.classcode, await t.series.superUniqueNumbers())
                    break
            }
        }

        // This has to happen last as it plays with the series schema setting
        if (param.items.includes('summary')) {
            ret.summary = await allSeriesSummary(t, req.auth.driverId())
        }

        return ret
    }))
}
