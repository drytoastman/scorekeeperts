import _ from 'lodash'
import { IDatabase, IMain, ColumnSet } from 'pg-promise'
import { v1 as uuidv1 } from 'uuid'
import { verifyDriverRelationship, cleanAttr } from './helper'
import { UUID } from '@common/util'
import { Car } from '@common/car'

let carcols: ColumnSet|undefined

export class CarRepository {
    constructor(private db: IDatabase<any>, private pgp: IMain) {
        if (carcols === undefined) {
            carcols = new pgp.helpers.ColumnSet([
                { name: 'carid', cnd: true, cast: 'uuid' },
                { name: 'driverid', cast: 'uuid' },
                'classcode', 'indexcode', 'number:value',
                { name: 'useclsmult', def: false },
                { name: 'attr',     cast: 'json', init: (col: any): any => { return cleanAttr(col.value) } },
                { name: 'modified', cast: 'timestamp', mod: ':raw', init: (): any => { return 'now()' } },
                { name: 'created',  cast: 'timestamp', init: (col: any): any => { return col.exists ? col.value : 'now()' } }
            ], { table: 'cars' })
        }
    }

    async getCarsbyDriverId(driverid: UUID): Promise<Car[]> {
        return this.db.any('SELECT * FROM cars WHERE driverid=$1', [driverid])
    }

    async deleteCarsbyDriverId(driverid: UUID): Promise<null> {
        return this.db.none('DELETE FROM cars WHERE driverid=$1', [driverid])
    }

    async getCarsActivityForDriverIds(driverids: UUID[]): Promise<Car[]> {
        return this.db.any('SELECT c.*, COUNT(distinct r.eventid)::int as eventsrun, COUNT(distinct re.eventid)::int as eventsreg FROM cars c ' +
                           'LEFT JOIN runs r ON c.carid=r.carid LEFT JOIN registered re ON c.carid=re.carid ' +
                           'WHERE c.driverid in ($1:csv) GROUP BY c.carid', [driverids])
    }

    async getCarsById(carids: UUID[]): Promise<Car[]> {
        if (carids.length === 0) { return [] }
        return this.db.any('SELECT * FROM cars WHERE carid IN ($1:csv)', [carids])
    }

    async getCarsByNotId(carids: UUID[]): Promise<Car[]> {
        if (carids.length === 0) { return this.getAllCars() }
        return this.db.any('SELECT * FROM cars WHERE carid NOT IN ($1:csv)', [carids])
    }

    async deleteById(carids: UUID[]): Promise<UUID[]> {
        if (carids.length === 0) { return [] }
        return this.db.any('DELETE FROM cars WHERE carid IN ($1:csv) RETURNING carid', [carids])
    }

    async getAllCars(): Promise<Car[]> {
        return this.db.any('SELECT * FROM cars')
    }

    async updateCars(type: string, cars: Car[], verifyid: UUID|null = null): Promise<Car[]> {
        if (type === 'insert') {
            cars.forEach(c => {
                c.carid = uuidv1()
                if (verifyid) c.driverid = verifyid
            })
            return this.db.any(this.pgp.helpers.insert(cars, carcols) + ' RETURNING *')
        }

        if (verifyid) await verifyDriverRelationship(this.db, cars.map(c => c.carid), verifyid)

        if (type === 'update') return this.db.any(this.pgp.helpers.update(cars, carcols) + ' WHERE v.carid = t.carid RETURNING *')
        if (type === 'delete') return this.db.any('DELETE from cars WHERE carid in ($1:csv) RETURNING carid', cars.map(c => c.carid))

        throw Error(`Unknown operation type ${JSON.stringify(type)}`)
    }

    async updateCarDriverIds(newid: UUID, oldids: UUID[]): Promise<Car[]> {
        const cars = await this.db.any('UPDATE cars SET driverid=$1,modified=now() WHERE driverid IN ($2:csv) RETURNING *', [newid, oldids])
        for (const c of cars) {
            await this.getActivityForCar(c)
        }
        return cars
    }

    async getActivityForCar(car: Car): Promise<Car> {
        car.eventsrun = (await this.db.one('SELECT COUNT(distinct eventid)::int FROM runs WHERE carid=$1', [car.carid])).count
        car.eventsreg = (await this.db.one('SELECT COUNT(distinct eventid)::int FROM registered WHERE carid=$1', [car.carid])).count
        return car
    }

    async searchByClass(classcodes: string[]): Promise<UUID[]> {
        return this.workByClass(classcodes, true)
    }

    async deleteByClass(classcodes: string[]): Promise<UUID[]> {
        return this.workByClass(classcodes, false)
    }

    private async workByClass(classcodes: string[], countonly: boolean): Promise<UUID[]> {
        if (!classcodes.length) return []
        const start = countonly ? 'SELECT carid ' : 'DELETE '
        const end   = countonly ? '' : 'RETURNING carid'
        return this.db.any(start + 'FROM cars WHERE classcode in ($1:csv) AND carid NOT IN ' +
            '(SELECT carid FROM runs UNION SELECT carid FROM registered UNION SELECT carid FROM payments UNION SELECT carid FROM challengeruns) ' + end,
            [classcodes])
    }
}
