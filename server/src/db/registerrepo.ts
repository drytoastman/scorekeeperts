import { UUID, Registration, Payment } from '@common/lib'
import { IDatabase, IMain, ColumnSet } from 'pg-promise'
import _ from 'lodash'
import { verifyDriverRelationship } from './helper'

let regcols: ColumnSet|undefined

export class RegisterRepository {
    // eslint-disable-next-line no-useless-constructor
    constructor(private db: IDatabase<any>, private pgp: IMain) {
        if (regcols === undefined) {
            regcols = new pgp.helpers.ColumnSet([
                { name: 'eventid', cnd: true, cast: 'uuid' },
                { name: 'carid',   cnd: true, cast: 'uuid' },
                'session',
                { name: 'modified', cast: 'timestamp', mod: ':raw', init: (): any => { return 'now()' } }
            ], { table: 'registered' })
        }
    }

    async getRegistrationbyDriverId(driverid: UUID): Promise<Registration[]> {
        return this.db.any('SELECT r.* FROM registered AS r JOIN cars c ON r.carid=c.carid WHERE c.driverid=$1', [driverid])
    }

    async getRegistrationByEventId(eventid: UUID): Promise<Registration[]> {
        return this.db.any('SELECT * FROM registered WHERE eventid=$1', [eventid])
    }

    async getRegistrationSummary(driverid: UUID): Promise<object[]> {
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
        const singles = await this.db.any('select eventid,count(carid) from registered group by eventid')
        const uniques = await this.db.any('select r.eventid,count(distinct c.driverid) from registered r join cars c on r.carid=c.carid group by r.eventid')
        const collect = {}

        function add(eventid: UUID, label: string, count: number): void {
            if (!(eventid in collect)) { collect[eventid] = {} }
            collect[eventid][label] = count
        }

        singles.forEach(row => add(row.eventid, 'all', row.count))
        uniques.forEach(row => add(row.eventid, 'unique', row.count))

        const ret: object[] = []
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
        return this.db.any('SELECT p.* FROM payments AS p JOIN cars c ON p.carid=c.carid WHERE c.driverid=$1 and p.eventid=$2', [driverid, eventid])
    }

    async updateRegistration(type: string, reg: Registration[], eventid: UUID, driverid: UUID): Promise<Object> {
        await verifyDriverRelationship(this.db, reg.map(r => r.carid), driverid)

        function keys(v:any) {  return v.carid + v.session }

        if (type === 'eventupdate') {
            const curreg  = await this.eventReg(driverid, eventid)
            const curpay  = await this.eventPay(driverid, eventid)
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
                    openspots = _.orderBy(openspots, [o => o!.session === p.session ? 1 : 2])
                    const o = openspots.shift() // can't be null if we tested for zero above
                    p.newcarid = o!.carid
                    p.newsession = o!.session
                })
            }

            await this.db.tx(async t => {
                for (const d of todel)   { await t.none('DELETE FROM registered WHERE eventid=$(eventid) AND carid=$(carid) AND session=$(session)', d) }
                for (const i of toadd)   { await t.none(this.pgp.helpers.insert(i, regcols)) }
                for (const p of deadpay) { await t.none('UPDATE payments SET carid=$(newcarid), session=$(newsession), modified=now() WHERE payid=$(payid)', p) }
            }).catch(e => {
                throw e
            })

            return {
                registered: await this.eventReg(driverid, eventid),
                payments: await this.eventPay(driverid, eventid),
                eventid: eventid
            }
        }

        throw Error(`Unknown operation type ${JSON.stringify(type)}`)
    }
}
