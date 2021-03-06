import { UUID, DataValidationRules, isUUIDV, MaxLength, Max, isTimestamp, nonBlank, isPrintable, isNumber, UTCString } from './util'

export interface Car
{
    carid:      UUID;
    driverid:   UUID;
    classcode:  string;
    indexcode:  string;
    number:     number;
    useclsmult: boolean;
    attr?: {
        year:  string;
        make:  string;
        model: string;
        color: string;
    }
    modified:   UTCString;
    created:    UTCString;

    eventsrun?: number;
    eventsreg?: number;
    series?: string;
}

export function carMatch(car: Car, r: RegExp): boolean {
    if (!car) return false
    return r.test(car.classcode) || r.test(car.indexcode) || r.test(car.number.toString()) ||  (
        !!car.attr && (r.test(car.attr.year) || r.test(car.attr.make) || r.test(car.attr.model) || r.test(car.attr.color))
    )
}

export const CarValidator: DataValidationRules = {
    carid:      [isUUIDV],
    driverid:   [isUUIDV],
    classcode:  [nonBlank], // is in somelist
    indexcode:  [], // is in somelist
    number:     [isNumber, Max(1999)],
    useclsmult: [],
    modified:   [],
    created:    [isTimestamp],
    year:       [isPrintable(true), MaxLength(8)],
    make:       [isPrintable(true), MaxLength(24)],
    model:      [isPrintable(true), MaxLength(24)],
    color:      [isPrintable(true), MaxLength(24)]
}
