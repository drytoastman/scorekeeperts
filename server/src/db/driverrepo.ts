import bcrypt from 'bcrypt'
import { UUID, Driver } from '@common/lib'
import { IDatabase, ColumnSet, IMain } from 'pg-promise'

let drivercols: ColumnSet|undefined


export class DriverRepository {
    constructor(private db: IDatabase<any>, private pgp: IMain) {
        this.db = db
        if (drivercols === undefined) {
            drivercols = new pgp.helpers.ColumnSet([
                { name: 'driverid', cnd: true, cast: 'uuid' },
                'firstname', 'lastname', 'email', 'username', 'barcode',
                { name: 'optoutmail', def: false },
                { name: 'attr', cast: 'json' },
                { name: 'modified', cast: 'timestamp', mod: ':raw', init: (): any => { return 'now()' } },
                { name: 'created',  cast: 'timestamp', init: (col: any): any => { return col.exists ? col.value : 'now()' } }
            ], { table: 'drivers' })
        }
    }

    private filterDriver(d: Driver): Driver {
        delete d.password
        return d
    }

    async getDriverbyUsername(username: string): Promise<Driver> {
        return this.filterDriver(await this.db.one('SELECT * FROM drivers WHERE username=$1', [username]))
    }

    async getDriverById(driverid: UUID): Promise<Driver> {
        return this.filterDriver(await this.db.one('SELECT * FROM drivers WHERE driverid=$1', [driverid]))
    }

    async getUnsubscribeList(driverid: UUID): Promise<string[]> {
        return (await this.db.any('SELECT emaillistid FROM unsubscribe WHERE driverid=$1', [driverid])).map(r => r.emaillistid)
    }

    async checkPassword(driver: Driver, password: string): Promise<boolean> {
        return await bcrypt.compare(password, driver.password)
        // bcrypt.hash('tis.com', 12, function(err, hash) {
    }

    async updateDriver(type: string, driver: Driver, driverid: UUID): Promise<Driver> {
        if (driver.driverid !== driverid) {
            throw Error(`Trying to modify a driver that isn't you ${JSON.stringify(driver)} ${driverid}`)
        }

        if (type === 'update')  {
            return this.filterDriver(await this.db.one(this.pgp.helpers.update([driver], drivercols) + ' WHERE v.driverid = t.driverid RETURNING *'))
        }

        throw Error(`Unknown operation type ${JSON.stringify(type)}`)
    }
}
