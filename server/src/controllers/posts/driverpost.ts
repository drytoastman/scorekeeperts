import _ from 'lodash'

import { ScorekeeperProtocol } from '@/db'
import { paypalCapture } from '@/util/paypal'
import * as square from '@/util/square'

import { allSeriesSummary } from '../allseries'
import { UUID } from '@/common/util'
import { AuthError } from '../auth'
import { AUTHTYPE_DRIVER } from '@/common/auth'

export async function driverpost(tx: ScorekeeperProtocol, driverid: UUID|null, param: any) {
    const ret: any = {
        type: param.type,
        series: param.series
    }
    let addsummary = false

    if (!driverid) throw new AuthError(AUTHTYPE_DRIVER, param)
    await tx.series.setSeries(param.series)
    for (const key in param.items) {
        switch (key) {
            case 'drivers':
                ret.drivers = await tx.drivers.updateDriver(param.type, param.items.drivers, driverid)
                break

            case 'driversattr':
                ret.driversattr = await tx.drivers.updateDriverSeriesAttr(param.items.driversattr, driverid)
                break

            case 'cars':
                ret.cars = await tx.cars.updateCars(param.type, param.items.cars, driverid)
                addsummary = true
                break

            case 'registered':
                Object.assign(ret, await tx.register.updateRegistration(param.type, param.items.registered, param.eventid, driverid))
                addsummary = true
                break

            case 'unsubscribe':
                ret.unsubscribe = await tx.drivers.updateUnsubscribeList(param.items.unsubscribe, driverid)
                break

            case 'payments':
                if (param.paypal) {
                    ret.payments = await paypalCapture(tx, param.paypal, param.items.payments, driverid)
                } else if (param.square) {
                    ret.payments = await square.squareOrder(tx, param.square, param.items.payments, driverid)
                }
                addsummary = true
                break
        }
    }

    if (addsummary) {
        ret.summary = await allSeriesSummary(tx, driverid)
    }

    return ret
}
