import { IMain } from 'pg-promise'
import { ScorekeeperProtocol } from '.'
import { SeriesSettings, DefaultSettings } from '@common/settings'

export class SeriesRepository {
    // eslint-disable-next-line no-useless-constructor
    constructor(private db: ScorekeeperProtocol, private pgp: IMain) {
    }

    async setSeries(series: string): Promise<null> {
        const schema = ['public']
        if (series) schema.unshift(series)
        return this.db.none('set search_path=$1:csv', [schema])
    }

    async checkSeriesLogin(series: string, password: string): Promise<void> {
        if ((await this.db.one('SELECT data FROM localcache WHERE name=$1', [series])).data !== password) {
            throw Error('Invalid password')
        }
    }

    async seriesList(): Promise<string[]> {
        const results = await this.db.any('SELECT schema_name FROM information_schema.schemata ' +
            "WHERE schema_name NOT LIKE 'pg_%' AND schema_name NOT IN ('information_schema', 'public', 'template')")
        return results.map(v => v.schema_name)
    }

    async emailListIds(): Promise<string[]> {
        const ids = new Set<string>()
        for (const series of await this.seriesList()) {
            const results = await this.db.any('SELECT val FROM $1:name.settings WHERE name=\'emaillistid\'', series)
            results.forEach(r => ids.add(r.val))
        }
        return Array.from(ids.values()).sort()
    }

    _db2obj(key: string, val: string, obj: SeriesSettings): void {
        // Convert from text columns to local data type
        if (!(key in obj)) {
            obj[key] = val
        } else if (typeof (obj[key])  === 'boolean') {
            obj[key] = (val === '1')
        } else if (typeof (obj[key]) === 'number') {
            obj[key] = parseInt(val)
        } else {
            obj[key] = val
        }
    }

    _obj2db(def: DefaultSettings, key: string, val: any): string {
        // Convert from local data type back into text columns
        if (!(key in def)) { return val.toString() } else if (typeof (def[key]) === 'boolean') { return val ? '1' : '0' }
        return val.toString()
    }

    async superUniqueNumbers(): Promise<boolean> {
        return (await this.db.one("SELECT val FROM settings WHERE name='superuniquenumbers'")) === '1'
    }

    async seriesSettings(): Promise<SeriesSettings> {
        const ret: SeriesSettings = new DefaultSettings();
        (await this.db.any('SELECT name,val FROM settings')).forEach(r => {
            this._db2obj(r.name, r.val, ret)
        })
        return ret
    }

    async updateSettings(settings: SeriesSettings): Promise<SeriesSettings> {
        const def: SeriesSettings = new DefaultSettings()
        await this.db.tx(async tx => {
            for (const key in settings) {
                const val = this._obj2db(def, key, settings[key])
                await this.db.none('UPDATE settings SET val=$1,modified=now() WHERE name=$2', [val, key])
            }
        })
        return this.seriesSettings()
    }

    async dropSeries(series: string) {
        return await this.db.tx(async tx => {
            await tx.none('DROP SCHEMA $1:name CASCADE', [series])
            await tx.none('DROP USER $1:name', [series])
        })
    }
}
