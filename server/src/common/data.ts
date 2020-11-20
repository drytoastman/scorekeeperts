
export function getDList<V>(obj: {[k: string]: V[]}, key: string): V[] {
    return getD(obj, key, () => [])
}

export function getDObj<V>(obj: {[key:string]: {[key:string]: V}}, key: string): {[key:string]: V} {
    return getD(obj, key, () => ({}))
}

export function getD<V>(obj: {[k: string]: V}, key: string, def: () => V): V {
    let v = obj[key]
    if (!v) {
        v = def()
        obj[key] = v
    }
    return v
}

export function make2D<V>(d1: number): V[][] {
    // need to at least init first dimension so dynamic of second dimension set works
    const ret: V[][] = []
    for (let ii = 0; ii < d1; ii++) {
        ret[ii] = []
    }
    return ret
}

export class DefaultMap<K, V> extends Map<K, V> {
    default: () => V
    constructor(defaultFunction: () => V) {
        super()
        this.default = defaultFunction
    }

    getD(key: K): V {
        let v = super.get(key)
        if (!v) {
            v = this.default()
            this.set(key, v)
        }
        return v
    }
}

export function intersect<V>(setA: Set<V>, setB: Set<V>): Set<V> {
    const intersection = new Set<V>()
    for (const elem of setB) {
        if (setA.has(elem)) {
            intersection.add(elem)
        }
    }
    return intersection
}

export function difference<V>(setA: Set<V>, setB: Set<V>): Set<V> {
    const difference = new Set<V>(setA)
    for (const elem of setB) {
        difference.delete(elem)
    }
    return difference
}
