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
        await t.series.setSeries(ret.series)
        for (const item of param.items) {
            switch (item) {
                case 'drivers':     ret.drivers     = await t.drivers.getDriverById(req.auth.driverId()); break
                case 'serieslist':  ret.serieslist  = await t.series.seriesList(); break
                case 'listids':     ret.listids     = await t.series.emailListIds(); break
                case 'unsubscribe': ret.unsubscribe = await t.drivers.getUnsubscribeList(req.auth.driverId()); break
                case 'events':      ret.events      = await t.series.eventList(); break
                case 'cars':        ret.cars        = await t.cars.getCarsbyDriverId(req.auth.driverId()); break
                case 'registered':  ret.registered  = await t.register.getRegistrationbyDriverId(req.auth.driverId()); break
                case 'payments':    ret.payments    = await t.payments.getPaymentsbyDriverId(req.auth.driverId()); break
                case 'counts':      ret.counts      = await t.register.getRegistationCounts(); break
                case 'classes':     ret.classes     = await t.clsidx.classList(); break
                case 'indexes':     ret.indexes     = await t.clsidx.indexList(); break
                /*
                    if (!classdata) classdata = await t.clsidx.classData()
                    ret[item] = classdata[item]
                    break */
                case 'paymentaccounts':
                    ret.paymentaccounts = await t.payments.getPaymentAccounts()
                    break
                case 'paymentitems':
                    ret.paymentitems = await t.payments.getPaymentItems()
                    break
                case 'summary': break // deal with later
                case 'usednumbers':
                    ret.usednumbers = await t.register.usedNumbers(req.auth.driverId(), param.classcode, await t.series.superUniqueNumbers())
                    break

                case 'squareapplicationid':
                    ret.squareapplicationid = await t.payments.getSquareApplicationId()
                    break

                default: console.log(`don't understand ${item}`); break
            }
        }

        // This has to happen last as it plays with the series schema setting
        if (param.items.includes('summary')) {
            ret.summary = await allSeriesSummary(t, req.auth.driverId())
        }

        return ret
    }))
}
