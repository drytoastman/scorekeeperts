import { DataValidationRules, Length, isUUIDV, isDate, UUID, Range, Min, DateString, VuetifyValidationRule, MaxLength } from './util'

export interface SeriesEvent
{
    eventid: UUID;
    name: string;
    date: DateString;
    champrequire: boolean;
    useastiebreak: boolean;
    isexternal: boolean;
    regtype: number;
    regopened: Date;
    regclosed: Date;
    courses: number;
    runs: number;
    countedruns: number;
    segments: number;
    perlimit: number;
    sinlimit: number;
    totlimit: number;
    conepen: number;
    gatepen: number;
    ispro: boolean;
    ispractice: boolean;
    accountid: string;
    items: UUID[];
    attr: {
        chair: string;
        location: string;
        paymentreq: boolean;
    }
    modified: DateString;
    created: DateString;
}

export function hasOpened(event: SeriesEvent): boolean { return new Date() > new Date(event.regopened) }
export function hasClosed(event: SeriesEvent): boolean { return new Date() > new Date(event.regclosed) }
export function hasFinished(event: SeriesEvent): boolean { return new Date() >= new Date(event.date) }
export function isOpen(event: SeriesEvent):    boolean { return hasOpened(event) && !hasClosed(event) }
export function getSessions(event: SeriesEvent): string[] {
    switch (event.regtype) {
        case 2: return ['Day']
        case 1: return ['AM', 'PM']
        default: return []
    }
}

export const isSession: VuetifyValidationRule = v => { return ['', 'AM', 'PM', 'Day'].includes(v) || 'Session can only be one of AM, PM or Day' }

export const EventValidator: DataValidationRules = {
    eventid:       [isUUIDV],
    name:          [Length(4, 64)],
    date:          [isDate],
    champrequire:  [],
    useastiebreak: [],
    isexternal:    [],
    regtype:       [Range(0, 2)],
    regopened:     [isDate],
    regclosed:     [isDate],
    courses:       [Range(1, 10)],
    runs:          [Range(1, 50)],
    countedruns:   [Min(0)],
    segments:      [Min(0)],
    perlimit:      [Min(0)],
    sinlimit:      [Min(0)],
    totlimit:      [Min(0)],
    conepen:       [Min(0)],
    gatepen:       [Min(0)],
    ispro:         [],
    ispractice:    [],
    accountid:     [], // is in list
    modified:      [isDate],
    created:       [isDate],
    location:      [MaxLength(32)],
    notes:         [MaxLength(512)]
}