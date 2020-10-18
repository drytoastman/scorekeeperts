
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
