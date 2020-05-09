import { Car, UUID } from '@common/lib'
import { IDatabase, IMain, ColumnSet } from 'pg-promise'
import { v1 as uuidv1 } from 'uuid'

let carcols: ColumnSet|undefined

export class CarRepository {
    constructor(private db: IDatabase<any>, private pgp: IMain) {
        if (carcols === undefined) {
            carcols = new pgp.helpers.ColumnSet([
                { name: 'carid', cnd: true, cast: 'uuid' },
                { name: 'driverid', cast: 'uuid' },
                'classcode', 'indexcode', 'number:value',
                { name: 'useclsmult', def: false },
                { name: 'attr', cast: 'json' },
                { name: 'modified', cast: 'timestamp', mod: ':raw', init: (): any => { return 'now()' } },
                { name: 'created',  cast: 'timestamp', init: (col: any): any => { return col.exists ? col.value : 'now()' } }
            ], { table: 'cars' })
        }
    }

    async getCarsbyDriverId(driverid: UUID): Promise<Car[]> {
        return this.db.any('SELECT * FROM cars WHERE driverid=$1', [driverid])
    }

    async updateCars(type: string, cars: Car[], driverid: UUID): Promise<Car[]> {
        if (type === 'insert') {
            cars.forEach(c => { c.carid = uuidv1(); c.driverid = driverid })
            return this.db.any(this.pgp.helpers.insert(cars, carcols) + ' RETURNING *')
        }

        if (!cars.every(c => c.driverid === driverid)) {
            throw Error('Attemping to modifiy another drivers cars')
        }

        if (type === 'update') return this.db.any(this.pgp.helpers.update(cars, carcols) + ' WHERE v.carid = t.carid RETURNING *')
        if (type === 'delete') return this.db.any('DELETE from cars WHERE carid in ($1:csv) RETURNING carid', cars.map(c => c.carid))

        throw Error(`Unknown operation type ${JSON.stringify(type)}`)
    }
}
