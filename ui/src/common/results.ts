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
    anorder: number;

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

export interface EventNotice {
    firstname: string
    lastname: string
    net: number
    isold: boolean
    ispotential: boolean
}

export interface ExternalResult {
    position: number;
    pospoints: number;
    diffpoints: number;
    points: number;
    net: number;
    classcode: string;
}

export interface PointsStorage {
    drop: []
    total: number
    events: Event2Points
    usingbest: number
}

export interface TopTimesTable {
    titles: string[]
    colcount: number[]
    cols: string[][]
    fields: string[][]
    rows: TopTimeEntry[][]
}

export interface TopTimeEntry {
    name: string
    classcode: string
    indexstr: string
    indexval: number
    time: number
    current: boolean
    pos: number|null
    ispotential: boolean
    isold: boolean
}

export interface ChampEntrant {
    driverid: UUID
    firstname: string
    lastname: string
    eventcount: number
    position: number|null
    events: [ { eventdate: string, drop: boolean, points: number } ]
    missingrequired: string[]
    tiebreakers: number[]
    points: PointsStorage
    // decoration
    current: boolean
}

export interface ChampNotice {
    firstname: string
    lastname: string
    points: { total: number }
    ispotential: boolean
    isold: boolean
}

export interface PointStorage {
    total: number
    events: Event2Points
}

export class TopTimesKey {
    indexed: boolean
    counted: boolean
    course:  number
    title:   string   | null
    cols:    string[] | null
    fields:  string[] | null

    constructor(options: {[key:string]: any}) {
        this.indexed = false
        this.counted = false
        this.course = 0
        this.title = null
        this.cols = []
        this.fields = []
        Object.assign(this, options)
    }
}

export type Event2Points = {[key: string]: number}
export type EventResults = {[key: string]: Entrant[]} // classcode to entrant list
export type ChampResults = {[key: string]: ChampEntrant[]} // classcode to champ entrant list
