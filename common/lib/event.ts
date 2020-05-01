import { DataValidationRules, Length, isUUID, isDate, UUID, Range, Min } from './util'

export interface EventAttr
{
    chair: string;
    location: string;
}

export interface SeriesEvent
{
    eventid: UUID;
    name: string;
    date: Date;
    champrequire: [];
    useastiebreak: [];
    isexternal: [];
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
    ispro: [];
    ispractice: [];
    accountid: string;
    attr: EventAttr;
    modified: Date;
    created: Date;
}

export const EventValidator: DataValidationRules = {
    eventid:       [isUUID],
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
    created:       [isDate]
}
