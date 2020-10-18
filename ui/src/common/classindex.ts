import { Car } from './car'
import { SeriesEvent } from './event'
import { DataValidationRules, MaxLength, Length, isDecimal3, Min, isPrintable, isInteger, UUID } from './util'

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

export interface ClassOrder
{
    eventid: UUID;
    rungroup: number;
    classes: string[];
}

export class ClassData {
    classlist: {[key: string]: SeriesClass }
    indexlist: {[key: string]: SeriesIndex }

    constructor(classes: SeriesClass[], indexes: SeriesIndex[]) {
        this.classlist = {}
        this.indexlist = {}

        for (const c of classes) { this.classlist[c.classcode] = c }
        for (const i of indexes) { this.indexlist[i.indexcode] = i }
    }

    getCountedRuns(classcode: string, event: SeriesEvent): number {
        const classruns = this.classlist[classcode].countedruns || 999
        const eventruns = event.countedruns || 999
        return Math.min(classruns, eventruns)
    }

    getEffectiveIndex(car: Car): {value:number, str: string} {
        let indexval = 1.0
        let indexstr = ''
        try {
            const cls = this.classlist[car.classcode]

            if (cls.indexcode !== '') {
                indexval *= this.indexlist[cls.indexcode].value
                indexstr  = cls.indexcode
            }

            if (cls.carindexed && car.indexcode) {
                indexval *= this.indexlist[car.indexcode].value
                indexstr  = car.indexcode
            }

            if (cls.classmultiplier < 1.000) {
                const restrict = {} // FINISH self.restrictedClassMultiplierIndexes(car.classcode)
                if (!cls.carindexed || (car.indexcode in restrict && (!cls.usecarflag || car.useclsmult))) {
                    indexval *= cls.classmultiplier
                    indexstr = indexstr + '*'
                }
            }
        } catch (error) {
            // log.warning("getEffectiveIndex(%s,%s,%s) failed: %s" % (car.classcode, car.indexcode, car.useclsmult, e))
        }

        return { value: indexval, str: indexstr }
    }
}
