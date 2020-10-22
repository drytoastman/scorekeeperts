import _ from 'lodash'

import { Car } from '@common/car'
import { ScorekeeperProtocol } from '@/db'
import * as square from '@/util/square'

import { allSeriesCars, allSeriesDeleteDriverLinks, allSeriesMerge } from '../allseries'
import { AuthData } from '../auth'

export async function seriespost(tx: ScorekeeperProtocol, auth: AuthData, param: any) {
    const ret: any = {
        type: param.type,
        series: param.series
    }
    let dids

    await tx.series.setSeries(param.series)

    for (const key in param.items) {
        switch (key) {
            case 'drivers':
                if (param.type === 'delete') {
                    await allSeriesDeleteDriverLinks(tx, param.items.drivers.map(d => d.driverid))
                    await tx.series.setSeries(param.series)
                }
                ret.drivers = await tx.drivers.updateDriver(param.type, param.items.drivers)
                break

            case 'cars':
                ret.cars = await tx.cars.updateCars(param.type, param.items.cars)
                for (const c of ret.cars) {
                    await tx.cars.getActivityForCar(c)
                    c.series = param.series
                }
                break

            case 'registered':
                Object.assign(ret, await tx.register.updateRegistration(param.type, param.items.registered, param.eventid))
                break

            case 'payments':
                ret.payments = await tx.payments.updatePayments(param.type, param.items.payments)
                break

            case 'refund':
                ret.payments = await square.squareRefund(tx, param.items.refund)
                break

            case 'paymentaccounts':
                ret.paymentaccounts = await tx.payments.updatePaymentAccounts(param.type, param.items.paymentaccounts)
                if ('paymentsecrets' in param.items) {  // these are linked if there are errors
                    await tx.payments.updatePaymentAccountSecrets(param.type, param.items.paymentsecrets)
                }
                break

            case 'paymentitems':
                ret.paymentitems = await tx.payments.updatePaymentItems(param.type, param.items.paymentitems)
                break

            case 'squareoauthcode':
                ret.squareoauthresp = await square.squareoAuthRequest(tx, param.series, param.items.squareoauthcode)
                break

            case 'squareoauthlocation':
                await square.squareoAuthFinish(tx, param.items.squareoauthlocation.requestid, param.items.squareoauthlocation.locationid)
                ret.type = 'get'
                ret.paymentaccounts = await tx.payments.getPaymentAccounts()
                break

            case 'settings':
                ret.settings = await tx.series.updateSettings(param.items.settings)
                break

            case 'classes':
                ret.classes = await tx.clsidx.updateClasses(param.type, param.items.classes)
                break

            case 'indexes':
                ret.indexes = await tx.clsidx.updateIndexes(param.type, param.items.indexes)
                break

            case 'events':
                ret.events = await tx.events.updateEvents(param.type, param.items.events)
                break

            case 'carids':
                ret.cars = await tx.cars.getCarsById(param.items.carids)
                param.items.driverids = Array.from(new Set([...param.items.driverids, ...ret.cars.map((c:Car) => c.driverid)]))
                break

            case 'notcarids':
                ret.cars = await tx.cars.getCarsByNotId(param.items.notcarids)
                dids = new Set(ret.cars.map((c:Car) => c.driverid))
                for (const did of param.items.notdriverids) {
                    dids.delete(did)
                }
                param.items.driverids = Array.from(dids)
                break

            case 'localsettings':
                auth.requireAdmin()
                ret.localsettings = await tx.general.updateLocalSettings(param.items.localsettings)
                break

            case 'rotatekeygrip':
                auth.requireAdmin()
                await tx.general.rotateKeyGrip()
                break

            case 'editorids':
                ret.drivers = await tx.drivers.getDriversById(param.items.editorids)
                ret.cars = await allSeriesCars(tx, param.items.editorids)
                await tx.series.setSeries(param.series)  // restore series
                break

            case 'merge':
                Object.assign(ret, await allSeriesMerge(tx, param.items.merge.newid, param.items.merge.oldids))
                break

            case 'classorder':
                ret.classorder = await tx.clsidx.upsertClassOrder(param.type, param.items.classorder)
        }
    }

    if (param.items && 'driverids' in param.items) {
        // if user or other items requested these (do this outside switch for order)
        ret.drivers = await tx.drivers.getDriversById(param.items.driverids)
    }

    return ret
}
