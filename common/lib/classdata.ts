import { SeriesClass, SeriesIndex } from './classindex'

export class ClassData {
    classes: {[key: string]: SeriesClass}
    indexes: {[key: string]: SeriesIndex}

    constructor(cls: SeriesClass[], idx: SeriesIndex[]) {
        this.classes = {}
        this.indexes = {}
        cls.forEach(c => { this.classes[c.classcode] = c })
        idx.forEach(i => { this.indexes[i.indexcode] = i })
    }

    restrictedRegistrationIndexes(classcode: string): string[] {
        return this.restrictedIndexList(classcode, new RegExp('([+-])\\((.*?)\\)', 'g'))
    }

    restrictedClassMultiplierIndexes(classcode: string): string[] {
        return this.restrictedIndexList(classcode, new RegExp('([+-])\\[(.*?)\\]', 'g'))
    }

    restrictedIndexList(classcode: string, regex: RegExp): string[] {
        function globItem(item: string, fullset: string[]): Set<string> {
            const tomatch = new RegExp(`^${item.trim().replace('*', '.*')}$`)
            const ret = new Set<string>()
            fullset.forEach(code => {
                if (tomatch.test(code)) {
                    ret.add(code)
                }
            })
            return ret
        }

        function processList(matchpairs: string[][], fullset: string[]): Set<string> {
            const ret = new Set<string>()
            fullset.forEach(c => ret.add(c))

            for (let ii = 0; ii < matchpairs.length; ii++) {
                const pair = matchpairs[ii]

                if (!['+', '-'].includes(pair[0])) {
                    console.warn(`Index limit script: excepted + or -, found ${pair[0]}`)
                    continue
                }

                const ADD = (pair[0] === '+')
                if (ii === 0 && ADD) {
                    ret.clear()
                }

                const items = pair[1].split(',').filter((s: string) => s !== '')
                items.forEach(item => {
                    globItem(item, fullset).forEach(s => {
                        if (ADD) ret.add(s)
                        else     ret.delete(s)
                    })
                })
            }

            return ret
        }

        function getpairs(regex: RegExp, str: string): string[][] {
            let m: RegExpExecArray|null
            const ret: string[][] = []
            do {
                m = regex.exec(str)
                if (m) { ret.push([m[1], m[2]]) }
            } while (m)
            return ret
        }

        if ((!(classcode in this.classes)) || (!this.classes[classcode].carindexed)) { return [] }

        const idxlist = Object.keys(this.indexes)
        if (!this.classes[classcode].caridxrestrict) { return idxlist }

        const args = this.classes[classcode].caridxrestrict.replace(' ', '')
        const restrict = processList(getpairs(regex, args), idxlist)
        if (restrict.size === idxlist.length) {
            restrict.clear()
        }

        return [...restrict].sort()
    }
}
