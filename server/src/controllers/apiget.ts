import { Request, Response } from 'express'
import { db } from '../db'
import { allSeriesSummary } from './summary'
import { checkAuthItems, DRIVERITEMS, SERIESLIST } from './apiauth'

const DRIVERALL = 'driverall'

export async function apiget(req: Request, res: Response) {

    const series    = (req.query && req.query.series) as string
    const classcode = (req.query && req.query.classcode) as string
    const items     = (req.query && req.query.items)
    if (typeof items !== 'string' || items.length < 3) { // no requests
        res.status(400).json({ error: 'nothing requested' })
        return
    }

    let itemlist = items.split(',')
    try {
        // Replace 'driverall' with full driverauth list, shortcut to reduce data sent
        if  (itemlist.includes(DRIVERALL)) {
            itemlist = [...itemlist, ...DRIVERITEMS, SERIESLIST].filter(v => v !== DRIVERALL)
        }
        itemlist = checkAuthItems(itemlist, series, req.auth)
    } catch (error) {
        res.status(401).json({ error: error.toString() })
        return
    }

    res.json(await db.task('apiget', async t => {
        const ret: any = {
            type: 'get',
            series: series
        }

        let classdata
        await t.series.setSeries(ret.series)
        for (const item of itemlist.values()) {
            switch (item) {
                case 'driver':     ret.driver     = await t.drivers.getDriverById(req.auth.driverId()); break
                case 'serieslist': ret.serieslist = await t.series.seriesList(); break
                case 'emaillists':
                    ret.listids     = await t.series.emailListIds()
                    ret.unsubscribe = await t.drivers.getUnsubscribeList(req.auth.driverId())
                    break
                case 'events':     ret.events     = await t.series.eventList(); break
                case 'cars':       ret.cars       = await t.cars.getCarsbyDriverId(req.auth.driverId()); break
                case 'registered': ret.registered = await t.register.getRegistrationbyDriverId(req.auth.driverId()); break
                case 'payments':   ret.payments   = await t.payments.getPaymentsbyDriverId(req.auth.driverId()); break
                case 'counts':     ret.counts     = await t.register.getRegistationCounts(); break
                case 'classes':
                case 'indexes':
                    if (!classdata) classdata = await t.clsidx.classData()
                    ret[item] = classdata[item]
                    break
                case 'paymentaccounts':
                    ret.paymentaccounts = await t.payments.getPaymentAccounts()
                    break
                case 'paymentitems':
                    ret.paymentitems = await t.payments.getPaymentItems()
                    break
                case 'summary': break // deal with later
                case 'usednumbers':
                    ret.usednumbers = await t.register.usedNumbers(req.auth.driverId(), classcode, await t.series.superUniqueNumbers())
                    break

                default: console.log(`don't understand ${item}`); break
            }
        }

        // This has to happen last as it plays with the series schema setting
        if (itemlist.includes('summary')) {
            ret.summary = await allSeriesSummary(t, req.auth.driverId())
        }

        return ret
    }))
}
