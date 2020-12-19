export function restrictedRegistrationIndexes(caridxrestrict: string, indexlist: string[]): string[] {
    return restrictedIndexList(caridxrestrict, indexlist, new RegExp('([+-])\\((.*?)\\)', 'g'))
}

function restrictedIndexList(caridxrestrict: string, indexlist: string[], regex: RegExp): string[] {
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

    if (!caridxrestrict) { return indexlist }
    const args = caridxrestrict.replace(' ', '')
    const restrict = processList(getpairs(regex, args), indexlist)
    if (restrict.size === indexlist.length) {
        restrict.clear()
    }

    return [...restrict].sort()
}
