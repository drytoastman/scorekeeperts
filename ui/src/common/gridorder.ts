import orderBy from 'lodash/orderBy'
import { ClassOrder } from './classindex'
import { Car } from './car'

interface Entrant {
    // classcode: string
    number: number
    grid: number
}

class ClassWrapper {
    /* List of entries for this particular run group position */
    classcode: string
    numbers: Set<number>
    firsts: Entrant[]
    duals: Entrant[]
    changed = false

    constructor(classcode: string) {
        this.classcode = classcode
        this.numbers = new Set()
        this.firsts = []
        this.duals = []
    }

    addBlank() {
        // this.entries.push({number: -1, grid: -1} as Entrant)
    }
}

/*
class GridGroup {
    pad() {
        /* If the class is a odd # of entries and next class is not single, add a space *
        let rows = 0
        // codes = list(self.keys())

        for (let ii = 0; ii < this.classes.length-1; ii++) {
            const ce     = this.classes[ii]
            const cenext = this.classes[ii+1]

            rows += ce.length()
            if ((rows % 2) != 0 && cenext.length() > 1) {
                ce.addBlank()
                rows += 1
            }
        }
    }

    truelength() {
        /* count of entrants in this rungroup *
        return sumBy(this.classes, c => c.truelength())
    }
}
*/


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

    number() {
        console.log('number')
        for (const group of this.groups) {
            let gridlow = 0
            let gridhi = 100
            for (const cw of group) {
                cw.firsts = orderBy(cw.firsts, ['number'])
                cw.duals  = orderBy(cw.duals,  ['number'])

                for (const e of cw.firsts) {
                    gridlow++
                    e.grid = gridlow
                }
                for (const e of cw.duals) {
                    gridhi++
                    e.grid = gridhi
                }
            }
        }
    }
}


export function createGridReport(classorders: ClassOrder[], classcodes: string[], cars: Car[]): GridReport {
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

    for (const c of cars) {
        if (c.number < 100) {
            report.groupmap[c.classcode].firsts.push({ number: c.number, grid: -1 })
        } else {
            report.groupmap[c.classcode].duals.push({ number: c.number, grid: -1 })
        }
    }

    report.number()
    return report
}
