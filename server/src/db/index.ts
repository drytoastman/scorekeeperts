import pgpromise, { IInitOptions, IDatabase } from 'pg-promise'
import { CarRepository } from './carrepo'
import { SeriesRepository } from './seriesrepo'
import { DriverRepository } from './driverrepo'
import { ClassRepository } from './classrepo'
import { RegisterRepository } from './registerrepo'
import { TableWatcher } from './tablewatcher'
import { PaymentsRepository } from './paymentsrepo'

interface DBExtensions {
    series: SeriesRepository;
    clsidx: ClassRepository;
    drivers: DriverRepository;
    cars: CarRepository;
    register: RegisterRepository;
    payments: PaymentsRepository;
}

type ScorekeeperProtocol = IDatabase<DBExtensions> & DBExtensions;

const initOptions: IInitOptions<DBExtensions> = {
    extend(obj: ScorekeeperProtocol) {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        obj.series = new SeriesRepository(obj)
        obj.clsidx = new ClassRepository(obj)
        obj.drivers = new DriverRepository(obj)
        obj.cars = new CarRepository(obj, pgp)
        obj.register = new RegisterRepository(obj, pgp)
        obj.payments = new PaymentsRepository(obj)
    }
}

const cn = {
    host: '127.0.0.1',
    port: 6432,
    database: 'scorekeeper',
    user: 'localuser',
    max: 30
}

export const pgp = pgpromise(initOptions)
pgp.pg.types.setTypeParser(pgp.pg.types.builtins.TIMESTAMP, function(stringValue) { return new Date(stringValue + '+0000') })
export const db = pgp(cn)
export const tableWatcher = new TableWatcher(db)
