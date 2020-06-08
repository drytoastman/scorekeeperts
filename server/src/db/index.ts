import pgpromise, { IInitOptions, IDatabase, IBaseProtocol } from 'pg-promise'
import { CarRepository } from './carrepo'
import { SeriesRepository } from './seriesrepo'
import { DriverRepository } from './driverrepo'
import { ClassRepository } from './classrepo'
import { RegisterRepository } from './registerrepo'
import { TableWatcher } from './tablewatcher'
import { PaymentsRepository } from './paymentsrepo'

export interface DBExtensions {
    series: SeriesRepository;
    clsidx: ClassRepository;
    drivers: DriverRepository;
    cars: CarRepository;
    register: RegisterRepository;
    payments: PaymentsRepository;
}

export type ScorekeeperProtocol = IBaseProtocol<DBExtensions> & DBExtensions;
type ScorekeeperProtocolDB = IDatabase<DBExtensions> & DBExtensions;

const initOptions: IInitOptions<DBExtensions> = {
    extend(obj: ScorekeeperProtocolDB) {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        obj.series = new SeriesRepository(obj)
        obj.clsidx = new ClassRepository(obj)
        obj.drivers = new DriverRepository(obj, pgp)
        obj.cars = new CarRepository(obj, pgp)
        obj.register = new RegisterRepository(obj, pgp)
        obj.payments = new PaymentsRepository(obj, pgp)
    }
}

const DBHOST = process.env.DBHOST || '127.0.0.1'
let DBPORT = 6432
try {
    if (process.env.DBPORT) {
        DBPORT = Number.parseInt(process.env.DBPORT)
    }
} catch (error) {
    console.error(error)
}

const cn = {
    host: DBHOST,
    port: DBPORT,
    database: 'scorekeeper',
    user: 'localuser',
    application_name: 'scnodejs',
    max: 30
}

export const pgp = pgpromise(initOptions)
pgp.pg.types.setTypeParser(pgp.pg.types.builtins.TIMESTAMP, function(stringValue) { return new Date(stringValue + '+0000') })
export const db = pgp(cn)
export const tableWatcher = new TableWatcher(db)
