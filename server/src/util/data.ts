
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
