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

    async getDriverById(driverid: UUID): Promise<Driver> {
        return this.filterDriver(await this.db.one('SELECT * FROM drivers WHERE driverid=$1', [driverid]))
    }

    async getUnsubscribeList(driverid: UUID): Promise<string[]> {
        return (await this.db.any('SELECT emaillistid FROM unsubscribe WHERE driverid=$1', [driverid])).map(r => r.emaillistid)
    }

    async checkLogin(username: string, password: string): Promise<UUID> {
        const d = await this.db.one('SELECT * FROM drivers WHERE username=$1', [username])
        if (await bcrypt.compare(password, d.password)) {
            return d.driverid
        }
        throw new Error('Authentication Failed')
    }

    async changePassword(driverid: UUID, currentpassword: string, newpassword: string): Promise<void> {
        const d = await this.db.one('SELECT * FROM drivers WHERE driverid=$1', [driverid])
        if (!await bcrypt.compare(currentpassword, d.password)) {
            throw new Error('Current password was incorrect')
        }

        const hash = await bcrypt.hash(newpassword, 12) // , function(err, hash) { })
        await this.db.none('UPDATE drivers SET password=$1,modified=now() WHERE driverid=$2', [hash, driverid])
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
