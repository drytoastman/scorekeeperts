import { DataValidationRules, MaxLength, Length, isDecimal3, Min, isPrintable, isInteger } from './util'

export interface SeriesIndex
{
    indexcode: string;
    descrip: string;
    value: number;
}

export const IndexValidator: DataValidationRules = {
    indexcode: [Length(2, 8)],
    descrip:   [isPrintable(true), MaxLength(128)],
    value:     [isDecimal3]
}

export interface SeriesClass
{
    classcode: string;
    descrip: string;
    eventtrophy: boolean;
    champtrophy: boolean;
    carindexed: boolean;
    secondruns: boolean;
    indexcode: string;
    classmultiplier: number;
    usecarflag: boolean;
    caridxrestrict: string;
    countedruns: number;
}

export const ClassValidator: DataValidationRules =
{
    classcode:       [Length(2, 8)],
    descrip:         [MaxLength(128)],
    eventtrophy:     [],
    champtrophy:     [],
    carindexed:      [],
    secondruns:      [],
    indexcode:       [MaxLength(8)],
    classmultiplier: [isDecimal3],
    usecarflag:      [],
    caridxrestrict:  [MaxLength(128)],
    countedruns:     [isInteger, Min(0)]
}
