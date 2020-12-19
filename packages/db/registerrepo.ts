import { IMain } from 'pg-promise'
import _ from 'lodash'
import { Registration, Payment, RegValidator, UUID, validateObj, Car } from 'sctypes'
import { verifyDriverRelationship } from './helper'
import { ScorekeeperProtocolDB, TABLES } from '.'

export class RegisterRepository {
    constructor(private db: ScorekeeperProtocolDB, private pgp: IMain) {
    }

    async getRegistrationbyDriverId(driverid: UUID): Promise<Registration[]> {
        return this.db.any('SELECT r.* FROM registered AS r JOIN cars c ON r.carid=c.carid WHERE c.driverid=$1', [driverid])
    }

    async getAllRegistration(eventid?: UUID): Promise<Registration[]> {
        return this.db.any('SELECT * FROM registered ' + (eventid ? 'WHERE eventid=$1 ' : ''), [eventid])
    }

    async getRegisteredCars(eventid: UUID): Promise<Car[]> {
        return this.db.any('SELECT * FROM cars c JOIN registered r ON r.carid=c.carid WHERE r.eventid=$1', [eventid])
    }

    async getFullEventRegistration(eventid: UUID, paymentRequired: boolean): Promise<any[]> {
        const rows = await this.db.any('SELECT d.driverid,d.firstname,d.lastname,d.email,d.barcode,d.optoutmail,c.*,r.*,r.modified as regmodified, ' +
                    'd.attr as dattr, sa.attr as sattr ' +
                    'FROM cars c JOIN drivers d ON c.driverid=d.driverid JOIN registered r ON r.carid=c.carid LEFT JOIN seriesattr sa ON c.driverid=sa.driverid ' +
                    'WHERE r.eventid=$1 ORDER BY c.number', [eventid])

        const regobj: {[key:string]: any} = {}
        for (const row of rows) {
            row.payments = []
            regobj[row.carid + row.session] = _.merge(row, { ...row.dattr, ...row.attr, ...row.sattr })
        }

        for (const p of await this.db.any('SELECT * FROM payments WHERE eventid=$1', [eventid])) {
            const key = p.carid + p.session
            if (key in regobj) {
                regobj[key].payments.push(p)
            }
        }

        const ret = Object.values(regobj)
        if (paymentRequired) {
            return ret.filter(v => v.payments.length > 0)
        }
        return ret
    }

    async getRegistrationSummary(driverid: UUID): Promise<Record<string, any>[]> {
        const events:any[] = []
        for (const row of await this.db.any(
            'SELECT r.*,c.*,e.eventid,e.name,e.date FROM registered AS r JOIN cars c ON r.carid=c.carid JOIN events e ON r.eventid=e.eventid ' +
            'WHERE c.driverid=$1 ORDER BY e.date,c.classcode', [driverid])) {
            if (!(row.eventid in events)) {
                events[row.eventid] = {
                    name: row.name,
                    date: row.date,
                    reg: []
                }
            }
            events[row.eventid].reg.push(row)
        }
        return Object.values(events)
    }

    async getRegistationCounts(): Promise<Record<string, any>> {
        const singles = await this.db.any(
            'select e.eventid,count(r.carid) from registered r right join events e on r.eventid=e.eventid group by e.eventid')
        const uniques = await this.db.any(
            'select e.eventid,count(distinct c.driverid) from registered r right join events e on r.eventid=e.eventid left join cars c on r.carid=c.carid group by e.eventid')
        const collect = {}

        function add(eventid: UUID, label: string, count: number): void {
            if (!(eventid in collect)) { collect[eventid] = {} }
            collect[eventid][label] = count
        }

        singles.forEach(row => add(row.eventid, 'all', row.count))
        uniques.forEach(row => add(row.eventid, 'unique', row.count))

        const ret: Record<string, any>[] = []
        for (const key in collect) {
            const v = collect[key]
            ret.push({ eventid: key, all: v.all, unique: v.unique })
        }
        return ret
    }

    async usedNumbers(driverid: UUID, classcode: string, superunique: boolean): Promise<number[]> {
        let res: Promise<any[]>
        if (superunique) {
            res = this.db.any('SELECT DISTINCT number FROM cars WHERE number NOT IN (SELECT number FROM cars WHERE driverid = $1) ORDER BY number', [driverid])
        } else {
            res = this.db.any('SELECT DISTINCT number FROM cars WHERE classcode=$1 AND number NOT IN (SELECT number FROM cars WHERE classcode=$2 AND driverid=$3) ORDER BY number',
                [classcode, classcode, driverid])
        }

        return (await res).map(r => r.number)
    }

    private async eventReg(driverid: UUID, eventid: UUID): Promise<Registration[]> {
        return this.db.any('SELECT r.* FROM registered AS r JOIN cars c ON r.carid=c.carid WHERE c.driverid=$1 and r.eventid=$2', [driverid, eventid])
    }

    private async eventPay(driverid: UUID, eventid: UUID): Promise<Payment[]> {
        return this.db.any('SELECT * FROM payments WHERE driverid=$1 and eventid=$2 and refunded=false', [driverid, eventid])
    }

    async updateRegistration(type: string, reg: Registration[], eventid: UUID, verifyid: UUID|null = null): Promise<Record<string, any>> {
        if (verifyid) await verifyDriverRelationship(this.db, reg.map(r => r.carid), verifyid)

        function keys(v:any) {  return `${v.carid},${v.session}` }

        if (type === 'delete') {
            for (const r of reg)   {
                await this.db.none('DELETE FROM registered WHERE eventid=$(eventid) AND carid=$(carid) AND session=$(session)', r)
            }
            return { registered: reg }
        } else if (type === 'eventupdate' && verifyid) {
            reg.forEach(r => validateObj(r, RegValidator))

            reg = _.orderBy(reg, 'rorder')
            reg.forEach((r, ii) => {  // reset rorder to lowest levels
                r.rorder = ii
            })

            const curreg  = await this.eventReg(verifyid, eventid)
            const curpay  = await this.eventPay(verifyid, eventid)
            const toadd   = _.differenceBy(reg, curreg, keys)
            const todel   = _.differenceBy(curreg, reg, keys)
            const deadpay = _.intersectionBy(curpay, todel, keys) as any[] // lets me append a few things for later update

            // If any of the deleted cars had a payment, we need to move that to an open unchanged or new registration
            if (deadpay.length > 0) {
                let openspots = _.differenceBy(reg, curpay, keys)
                deadpay.forEach(p => {
                    if (openspots.length === 0) {
                        throw new Error('Change aborted: would leave orphaned payment(s) as there were no registrations to move the payment to')
                    }
                    openspots = _.orderBy(openspots, [o => o?.session === p.session ? 1 : 2])
                    const o = openspots.shift() // can't be null if we tested for zero above
                    p.newcarid = o?.carid
                    p.newsession = o?.session
                })
            }

            for (const u of reg.filter(r => !todel.includes(r) && !toadd.includes(r))) {  // set all rorders for non changing items, may be ignored if not changed
                await this.db.none('UPDATE registered SET rorder=$(rorder),modified=now() WHERE eventid=$(eventid) AND carid=$(carid) AND session=$(session)', u)
            }
            for (const d of todel)   { await this.db.none('DELETE FROM registered WHERE eventid=$(eventid) AND carid=$(carid) AND session=$(session)', d) }
            for (const i of toadd)   { await this.db.none(this.pgp.helpers.insert(i, TABLES.registered)) }
            for (const p of deadpay) { await this.db.none('UPDATE payments SET carid=$(newcarid), session=$(newsession), modified=now() WHERE payid=$(payid)', p) }

            return {
                registered: await this.eventReg(verifyid, eventid),
                payments: await this.eventPay(verifyid, eventid),
                eventid: eventid
            }
        }

        throw Error(`Unknown operation type ${JSON.stringify(type)}`)
    }
}
