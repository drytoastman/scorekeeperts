import bcrypt from 'bcryptjs'
import { UUID, Driver } from '@common/lib'
import { IDatabase, ColumnSet, IMain } from 'pg-promise'

let drivercols: ColumnSet|undefined
let unsubcols: ColumnSet|undefined

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
        if (unsubcols === undefined) {
            unsubcols = new pgp.helpers.ColumnSet([
                'emaillistid',
                { name: 'driverid', cast: 'uuid' }
            ], { table: 'unsubscribe' })
        }
    }

    private filterDrivers(drivers: Driver[]): Driver[] {
        for (const d of drivers) {
            delete d.password
        }
        return drivers
    }

    async getAllDrivers(): Promise<Driver[]> {
        return this.filterDrivers(await this.db.any('SELECT * FROM drivers'))
    }

    async getDriversById(driverids: UUID[]): Promise<Driver[]> {
        if (driverids.length === 0) { return [] }
        return this.filterDrivers(await this.db.any('SELECT * FROM drivers WHERE driverid IN ($1:csv)', [driverids]))
    }

    async getDriverByNameEmail(firstname: string, lastname: string, email: string): Promise<Driver[]> {
        return this.filterDrivers(await this.db.any('SELECT * FROM drivers WHERE ' +
            'lower(firstname)=$1 AND lower(lastname)=$2 AND lower(email)=$3',
            [firstname.toLowerCase().trim(), lastname.toLowerCase().trim(), email.toLowerCase().trim()]))
    }

    async getDriverByUsername(username: string): Promise<Driver[]> {
        return this.filterDrivers(await this.db.any('SELECT * FROM drivers WHERE username=$1', [username.trim()]))
    }

    async getUnsubscribeByDriverId(driverid: UUID): Promise<string[]> {
        return (await this.db.any('SELECT emaillistid FROM unsubscribe WHERE driverid=$1', [driverid])).map(r => r.emaillistid)
    }

    async updateUnsubscribeList(unsublist: string[], driverid: UUID): Promise<string[]> {
        await this.db.none('DELETE FROM unsubscribe WHERE driverid=$1', [driverid])
        const rows = await this.db.any(this.pgp.helpers.insert(unsublist.map(v => ({ emaillistid: v, driverid: driverid })), unsubcols) + ' RETURNING emaillistid')
        return rows.map(r => r.emaillistid)
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

    async updateDriver(type: string, drivers: Driver[], driverid: UUID): Promise<Driver[]> {
        if (drivers[0].driverid !== driverid) {
            throw Error(`Trying to modify a driver that isn't you ${JSON.stringify(drivers[0])} ${driverid}`)
        }

        if (type === 'update')  {
            return this.filterDrivers(await this.db.any(this.pgp.helpers.update(drivers, drivercols) + ' WHERE v.driverid = t.driverid RETURNING *'))
        }

        throw Error(`Unknown operation type ${JSON.stringify(type)}`)
    }
}
