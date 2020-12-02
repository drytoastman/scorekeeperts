import bcrypt from 'bcryptjs'
import { IDatabase, IMain } from 'pg-promise'
import { v1 as uuidv1 } from 'uuid'

import { UUID, validateObj } from '@common/util'
import { Driver, DriverValidator } from '@common/driver'
import { TABLES } from '.'

export class DriverRepository {
    constructor(private db: IDatabase<any>, private pgp: IMain) {
        this.db = db
    }

    private filterDrivers(drivers: Driver[]): Driver[] {
        for (const d of drivers) {
            d.password = ''
        }
        return drivers
    }

    async getAllDrivers(): Promise<Driver[]> {
        return this.filterDrivers(await this.db.any('SELECT * FROM drivers'))
    }

    async getDriverMap(): Promise<{[driverid: string]: Driver}> {
        const ret = {}
        for (const d of await this.getAllDrivers()) {
            ret[d.driverid] = d
        }
        return ret
    }

    async getDriversBrief(): Promise<any[]> {
        return this.db.any('SELECT driverid,firstname,lastname,email FROM drivers ORDER BY lower(firstname),lower(lastname)')
    }

    async getDriversById(driverids: UUID[]): Promise<Driver[]> {
        if (driverids.length === 0) { return [] }
        return this.filterDrivers(await this.db.any('SELECT * FROM drivers WHERE driverid IN ($1:csv)', [driverids]))
    }

    async deleteById(driverids: UUID[]): Promise<Driver[]> {
        if (driverids.length === 0) { return [] }
        return this.db.any('DELETE FROM drivers WHERE driverid IN ($1:csv) RETURNING driverid', [driverids])
    }

    async getDriverByNameEmail(firstname: string, lastname: string, email: string): Promise<Driver|null> {
        return this.db.oneOrNone(
            'SELECT * FROM drivers WHERE lower(firstname)=$1 AND lower(lastname)=$2 AND lower(email)=$3', [
                firstname.toLowerCase().trim(), lastname.toLowerCase().trim(), email.toLowerCase().trim()
            ])
    }

    async getDriverByUsername(username: string): Promise<Driver|null> {
        return this.db.oneOrNone('SELECT * FROM drivers WHERE username=$1', [username.trim()])
    }

    async getDriverSeriesAttr(driverid: UUID): Promise<any> {
        const row = await this.db.oneOrNone('SELECT attr FROM seriesattr WHERE driverid=$1', [driverid])
        if (!row) return {}
        return row.attr
    }

    async updateDriverSeriesAttr(seriesattr: any, driverid: UUID) {
        await this.db.none('INSERT INTO seriesattr (driverid, attr) VALUES ($1, $2) ON CONFLICT(driverid) DO UPDATE SET attr=$2,modified=now()', [driverid, seriesattr, seriesattr])
        return this.getDriverSeriesAttr(driverid)
    }

    async getUnsubscribeByDriverId(driverid: UUID): Promise<string[]> {
        return (await this.db.any('SELECT emaillistid FROM unsubscribe WHERE driverid=$1', [driverid])).map(r => r.emaillistid)
    }

    async updateUnsubscribeList(unsublist: string[], driverid: UUID): Promise<string[]> {
        await this.db.none('DELETE FROM unsubscribe WHERE driverid=$1', [driverid])
        const rows = await this.db.any(this.pgp.helpers.insert(unsublist.map(v => ({ emaillistid: v, driverid: driverid })), TABLES.unsubscribe) + ' RETURNING emaillistid')
        return rows.map(r => r.emaillistid)
    }

    async checkLogin(username: string, password: string): Promise<UUID> {
        const d = await this.db.oneOrNone('SELECT * FROM drivers WHERE username=$1', [username])
        if (!d) {
            throw Error('Unknown username')
        }
        if (!await bcrypt.compare(password, d.password)) {
            throw new Error('Authentication Failed')
        }
        return d.driverid
    }

    async changePassword(driverid: UUID, currentpassword: string, newpassword: string, reset?: boolean): Promise<void> {
        if (!reset) {
            const d = await this.db.one('SELECT * FROM drivers WHERE driverid=$1', [driverid])
            if (!await bcrypt.compare(currentpassword, d.password)) {
                throw new Error('Current password was incorrect')
            }
        }

        const hash = await bcrypt.hash(newpassword, 12)
        await this.db.none('UPDATE drivers SET password=$1,modified=now() WHERE driverid=$2', [hash, driverid])
    }

    async createDriver(data: any): Promise<UUID> {
        data.driverid = uuidv1()
        await this.db.one(this.pgp.helpers.insert([data], TABLES.drivers) + ' RETURNING driverid')
        await this.changePassword(data.driverid, '', data.password, true)
        return data.driverid
    }

    async updateDriver(type: string, drivers: Driver[], verifyid: UUID|null = null): Promise<Driver[]> {
        if (type !== 'delete') {
            drivers.forEach(d => validateObj(d, DriverValidator))
        }

        if (verifyid && drivers[0].driverid !== verifyid) {
            throw Error(`Trying to modify a driver that you shouldn't ${JSON.stringify(drivers[0].driverid)} ${verifyid}`)
        }

        if (type === 'update')  {
            return this.filterDrivers(await this.db.any(this.pgp.helpers.update(drivers, TABLES.drivers) + ' WHERE v.driverid = t.driverid RETURNING *'))
        } else if (type === 'delete') {
            return this.db.any('DELETE from drivers WHERE driverid in ($1:csv) RETURNING driverid', drivers.map(d => d.driverid))
        }

        throw Error(`Unknown operation type ${JSON.stringify(type)}`)
    }
}
