import pgpromise, { IInitOptions, IDatabase, IBaseProtocol } from 'pg-promise'
import { CarRepository } from './carrepo'
import { SeriesRepository } from './seriesrepo'
import { DriverRepository } from './driverrepo'
import { EventsRepository } from './eventsrepo'
import { ClassRepository } from './classrepo'
import { RegisterRepository } from './registerrepo'
import { TableWatcher } from './tablewatcher'
import { PaymentsRepository } from './paymentsrepo'
import { GeneralRepository } from './generalrepo'
import { RunsRepository } from './runsrepo'
import { ChallengeRepository } from './challengerepo'
import { ResultsRepository } from './results'
import { MergeServerRepository } from './mergeserverrepo'
import { createColumnSets } from './tables'

export interface DBExtensions {
    series: SeriesRepository;
    clsidx: ClassRepository;
    drivers: DriverRepository;
    cars: CarRepository;
    register: RegisterRepository;
    payments: PaymentsRepository;
    general: GeneralRepository;
    runs: RunsRepository;
    challenge: ChallengeRepository;
    results: ResultsRepository;
    events: EventsRepository;
    merge: MergeServerRepository;
}

export type ScorekeeperProtocol = IBaseProtocol<DBExtensions> & DBExtensions;
export type ScorekeeperProtocolDB = IDatabase<DBExtensions> & DBExtensions;

const initOptions: IInitOptions<DBExtensions> = {
    extend(obj: ScorekeeperProtocolDB) {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        obj.series = new SeriesRepository(obj, pgp)
        obj.clsidx = new ClassRepository(obj, pgp)
        obj.events = new EventsRepository(obj, pgp)
        obj.drivers = new DriverRepository(obj, pgp)
        obj.cars = new CarRepository(obj, pgp)
        obj.register = new RegisterRepository(obj, pgp)
        obj.payments = new PaymentsRepository(obj, pgp)
        obj.general = new GeneralRepository(obj, pgp)
        obj.runs = new RunsRepository(obj, pgp)
        obj.challenge = new ChallengeRepository(obj, pgp)
        obj.results = new ResultsRepository(obj, pgp)
        obj.merge = new MergeServerRepository(obj, pgp)
    }
}

interface LogMethod {
    (message: string, ...meta: any[]): any
    (message: any): any
}
// placeholder until use initializes with real logger
export let dblog: {
    error: LogMethod,
    warn: LogMethod,
    info: LogMethod,
    debug: LogMethod
}

export function setdblog(v) {
    dblog = v
}

const DBHOST = process.env.DBHOST || '127.0.0.1'
let DBPORT = 6432
try {
    if (process.env.DBPORT) {
        DBPORT = Number.parseInt(process.env.DBPORT)
    }
} catch (error) {
    dblog!.error(error)
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
// Date have to store as strings in JSON anyhow (which is how we serve all the data), so don't bother parsing
// keeps the date parsing in the UI more straight forward as well (no timezones)
pgp.pg.types.setTypeParser(pgp.pg.types.builtins.TIMESTAMP, function(stringValue) { return stringValue.replace(' ', 'T') + 'Z' })
pgp.pg.types.setTypeParser(pgp.pg.types.builtins.DATE, function(stringValue) { return stringValue })
export const db = pgp(cn)
export const tableWatcher = new TableWatcher(db)
export const pgdb = pgp(Object.assign({}, cn, { user: 'postgres' }))

export const TABLES = createColumnSets(pgp)
export const SYNCTABLES = createColumnSets(pgp, true)
