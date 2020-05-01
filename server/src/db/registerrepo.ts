import { UUID, Registration, Payment } from '@common/lib'
import { IDatabase } from 'pg-promise'

export class RegisterRepository {
    constructor(private db: IDatabase<any>) {
        this.db = db
    }

    async getRegistrationbyDriverId(driverid: UUID): Promise<Registration[]> {
        return this.db.any('SELECT r.* FROM registered AS r JOIN cars c ON r.carid=c.carid WHERE c.driverid=$1', [driverid])
    }

    async getPaymentsbyDriverId(driverid: UUID): Promise<Payment[]> {
        return this.db.query('SELECT p.* FROM payments AS p JOIN cars c ON p.carid=c.carid WHERE c.driverid=$1', [driverid])
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
}
