import { PaymentItem } from './payments'
import {
    DataValidationRules, Length, isUUIDV, isTimestamp, UUID, Range, Min, DateString,
    VuetifyValidationRule, MaxLength, UTCString, isDate, parseDate, parseTimestamp
} from './util'

export interface ItemMap {
    eventid: UUID;
    itemid: string;
    maxcount: number;
    required: boolean;
    modified?: UTCString;
}

export interface SeriesEvent
{
    eventid: UUID;
    name: string;
    date: DateString;
    champrequire: boolean;
    useastiebreak: boolean;
    isexternal: boolean;
    regtype: number;
    regopened: UTCString;
    regclosed: UTCString;
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
    attr?: {
        chair: string;
        location: string;
        paymentreq: boolean;
    }
    modified: UTCString;
    created: UTCString;
}

export interface UIItemMap {
    checked: boolean,
    item: PaymentItem,
    map: ItemMap
}

function isPast(date: Date): boolean { return date.getTime() < Date.now() }

export function hasOpened(event: SeriesEvent):   boolean { return isPast(parseTimestamp(event.regopened)) }
export function hasClosed(event: SeriesEvent):   boolean { return isPast(parseTimestamp(event.regclosed)) }
export function hasFinished(event: SeriesEvent): boolean { return isPast(parseDate(event.date)) }
export function isOpen(event: SeriesEvent):      boolean { return hasOpened(event) && !hasClosed(event) }
export function hasSessions(event: SeriesEvent): boolean { return event.regtype > 0 }
export function getSessions(event: SeriesEvent): string[] {
    switch (event.regtype) {
        case REGTYPE_DAY:  return ['Day']
        case REGTYPE_AMPM: return ['AM', 'PM']
        default: return []
    }
}

export const REGTYPE_STANDARD = 0
export const REGTYPE_AMPM = 1
export const REGTYPE_DAY = 2

export const isSession: VuetifyValidationRule = v => { return v === null || ['', 'AM', 'PM', 'Day'].includes(v) || 'Session can only be one of AM, PM or Day' }

export const EventValidator: DataValidationRules = {
    eventid:       [isUUIDV],
    name:          [Length(4, 64)],
    date:          [isDate],
    champrequire:  [],
    useastiebreak: [],
    isexternal:    [],
    regtype:       [Range(0, 2)],
    regopened:     [isTimestamp],
    regclosed:     [isTimestamp],
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
    modified:      [isTimestamp],
    created:       [isTimestamp],
    location:      [MaxLength(32)],
    notes:         [MaxLength(512)]
}
