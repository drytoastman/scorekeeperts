import { Car } from './car'
import { UUID } from './util'

export enum RunStatus {
    PLC = 'PLC',
    OK = 'OK',
    DNF = 'DNF',
    DNS = 'DNS',
    RL = 'RL',
    NS = 'NS'
}

export interface Run {
    carid: UUID;
    rungroup: number;
    course: number;
    run: number;
    raw: number;
    cones: number;
    gates: number;
    status: string;
    modified: Date;  // dateutil.parser.parse(r.get('modified', '2000-01-02')) # Catch JSON placeholders
}

export interface DecoratedRun extends Run {
    pen: number;
    net: number;
    norder: number;
    rorder: number;

    ispotential?: boolean;
    oldbest?: boolean;
    rawimp?: number;
    netimp?: number;
}

export interface Entrant extends Car {
    firstname: string;
    lastname: string;
    scca: string

    rungroup: number;
    indexval: number;
    indexstr: string;
    runs: DecoratedRun[][];

    net: number; // Best counted net overall time
    pen: number; // Best counted unindexed overall time (includes penalties)
    netall: number; // Best net of all runs (same as net when counted not active)
    penall: number; // Best unindexed of all runs (same as pen when counted not active)
    dialraw: number; // Best raw times (OK status) used for dialin calculations

    // decorated
    potnet: number;
    oldnet: number;

    current: boolean;
    ispotential: boolean;
    isold: boolean;

    oldpoints: number;
    potpoints: number;

    position: number;
    trophy: boolean;
    pospoints: number;
    diffpoints: number;
    points: number;
    diff1: number;
    diffn: number;

    bonusdial: number;
    prodiff: number;
    prodial: number;

    // cache
    lastcourse: number;
}

const y2k = new Date('2000-01-01')
export class BlankEntrant implements Entrant {
    firstname = ''
    lastname = ''
    scca = ''
    rungroup = 0
    indexval = 0
    indexstr = ''
    runs = []
    net = 0
    pen = 0
    netall = 0
    penall = 0
    dialraw = 0
    potnet = 0
    oldnet = 0
    current = false
    ispotential = false
    isold = false
    oldpoints = 0
    potpoints = 0
    position = 0
    trophy = false
    pospoints = 0
    diffpoints = 0
    points = 0
    diff1 = 0
    diffn = 0
    bonusdial = 0
    prodiff = 0
    prodial = 0
    lastcourse = 0
    carid = ''
    driverid = ''
    classcode = ''
    indexcode = ''
    number = 0
    useclsmult= false
    attr =  { year: '',  make: '', model: '', color: '' }
    modified = y2k
    created = y2k
    eventsrun = 0
    eventsreg = 0
    series = ''
    constructor(obj: unknown) {
        Object.assign(this, obj)
    }
}

export interface ExternalResult {
    position: number;
    pospoints: number;
    diffpoints: number;
    points: number;
    net: number;
    classcode: string;
}

export interface ChampEntrant {
    driverid: UUID
    firstname: string
    lastname: string
    eventcount: number
    position: number|null
    points: number
    events: [ { eventdate: string, drop: boolean, points: number } ]
    missingrequired: string[]
    tiebreakers: number[]

    _pstorage: Event2Points
}

export type Event2Points = {[key: string]: number}
export type EventResults = {[key: string]: Entrant[]} // classcode to entrant list
export type ChampResults = {[key: string]: ChampEntrant[]} // classcode to champ entrant list
