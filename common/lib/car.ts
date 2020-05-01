import { UUID, DataValidationRules, isUUID, MaxLength, Max, isDate, nonBlank, isPrintable, isNumber } from './util'

export interface CarAttr
{
    year:  string;
    make:  string;
    model: string;
    color: string;
}

export interface Car
{
    carid:      UUID;
    driverid:   UUID;
    classcode:  string;
    indexcode:  string;
    number:     number;
    useclsmult: boolean;
    attr:       CarAttr;
    modified:   Date;
    created:    Date;
}

export const CarValidator: DataValidationRules = {
    carid:      [isUUID],
    driverid:   [isUUID],
    classcode:  [nonBlank], // is in somelist
    indexcode:  [], // is in somelist
    number:     [isNumber, Max(1999)],
    useclsmult: [],
    modified:   [isDate],
    created:    [isDate],
    year:       [isPrintable(true), MaxLength(8)],
    make:       [isPrintable(true), MaxLength(24)],
    model:      [isPrintable(true), MaxLength(24)],
    color:      [isPrintable(true), MaxLength(24)]
}
