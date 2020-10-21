import orderBy from 'lodash/orderBy'
import { ClassOrder } from './classindex'
import { Car } from './car'
import { Driver } from './driver'
import { UUID } from './util'

interface Entrant {
    car: Car|undefined
    driver: Driver|undefined
}

class ClassWrapper {
    /* List of entries for this particular run group position */
    classcode: string
    firsts: Entrant[] = []
    duals: Entrant[] = []
    changed = false

    constructor(classcode: string) {
        this.classcode = classcode
    }
}

class GridReport {
    /* The list of all rungroups for the event and the class groups in them */
    groups: ClassWrapper[][]
    groupmap: {[key: string]: ClassWrapper}

    constructor() {
        this.groups = []
        for (let ii = 0; ii <= 2; ii++) {
            this.groups[ii] = []
        }
        this.groupmap = {}
    }

    addClass(code: string, rungroup: number) {
        this.groupmap[code] = new ClassWrapper(code)
        this.groups[rungroup].push(this.groupmap[code])
    }

    addEntrants(entrants: Entrant[]) {
        for (const e of entrants) {
            if (!e.car) continue
            if (e.car.number < 100) {
                this.groupmap[e.car.classcode].firsts.push(e)
            } else {
                this.groupmap[e.car.classcode].duals.push(e)
            }
        }
        this.order('number')
    }

    order(key: string) {
        console.log(`order ${key}`)
        for (const group of this.groups) {
            for (const cw of group) {
                cw.firsts = orderBy(cw.firsts, key)
                cw.duals  = orderBy(cw.duals,  key)
            }
        }
    }

    table(group: number, key: string): Entrant[][] {
        const ret = [] as Entrant[][]
        let row = [] as Entrant[]
        const classes = this.groups[group]

        for (let ii = 0; ii < classes.length; ii++) {
            for (const e of classes[ii][key] as Entrant[]) {
                row.push(e)
                if (row.length >= 2) {
                    ret.push(row)
                    row = []
                }
            }
            const nextisone = (ii + 1 < classes.length) ? classes[ii + 1][key].length === 1 : false
            if ((row.length === 1) && !nextisone) {
                row.push({ car: undefined, driver: undefined })
                ret.push(row)
                row = []
            }
        }

        return ret
    }

    classorder(eventid: UUID): ClassOrder[] {
        const ret = [] as ClassOrder[]
        for (let ii = 1; ii < this.groups.length; ii++) { // skip 0
            ret.push({
                eventid: eventid,
                rungroup: ii,
                classes: this.groups[ii].map(cw => cw.classcode)
            })
        }
        return ret
    }
}


export function createGridReport(classorders: ClassOrder[], classcodes: string[], cars: Car[], drivermap: {[key: string]: Driver}): GridReport {
    console.log('create')
    const report = new GridReport()
    const rem = new Set(classcodes.filter(k => k !== 'HOLD'))

    for (const co of classorders) {
        for (const code of co.classes) {
            report.addClass(code, co.rungroup)
            rem.delete(code)
        }
    }
    for (const code of rem) {
        report.addClass(code, 0)
    }

    report.addEntrants(cars.map(c => ({ car: c, driver: drivermap[c.driverid] })))
    return report
}
