import bcrypt from 'bcrypt'
import { UUID, Driver } from '@common/lib'
import { IDatabase } from 'pg-promise'

export class DriverRepository {
    constructor(private db: IDatabase<any>) {
        this.db = db
    }

    async getDriverbyUsername(username: string): Promise<Driver> {
        return await this.db.one('SELECT * FROM drivers WHERE username=$1', [username])
    }

    async getDriverById(driverid: UUID): Promise<Driver> {
        return await this.db.one('SELECT * FROM drivers WHERE driverid=$1', [driverid])
    }

    async checkPassword(driver: Driver, password: string): Promise<boolean> {
        return await bcrypt.compare(password, driver.password)
        // bcrypt.hash('tis.com', 12, function(err, hash) {
    }
}
