import _ from 'lodash'
import { Car } from './car'
import { UUID } from './util'

export const y2k = new Date('2000-01-01')

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


export function getLastCourse(e: Entrant): number {
    /* Find the last course information for an entrant based on mod tags of runs, unless is already specified */
    if (e.lastcourse) return e.lastcourse

    let lasttime = y2k
    for (const c of e.runs) {
        for (const r of c) {
            if (r.modified > lasttime) {
                lasttime = r.modified
                e.lastcourse = r.course
            }
        }
    }

    return e.lastcourse
}

export function getBestNetRun(e: Entrant, course = 0, norder = 1): DecoratedRun|undefined {
    /*
        Get the best net run for last course run by an entrant
        If course is specified, overrides default of last
        If norder is specified, overrides default of 1
    */
    if (course === 0) {
        course = getLastCourse(e)
    }
    return e.runs[course - 1].filter(r => r.norder === norder && r.status !== RunStatus.PLC)[0] || undefined
}

export function getLastRun(e: Entrant): DecoratedRun|undefined {
    /* Get the last recorded run on any course */
    const course = getLastCourse(e)
    const runs: DecoratedRun[] = e.runs[course - 1].filter(r => r.status !== RunStatus.PLC)
    return _.maxBy(runs, 'run')
}

export type EventResults = Map<string|number, Entrant[]>;

export interface ExternalResult {
    position: number;
    pospoints: number;
    diffpoints: number;
    points: number;
    net: number;
    classcode: string;
}
