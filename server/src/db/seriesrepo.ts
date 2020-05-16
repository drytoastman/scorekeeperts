import { SeriesEvent, SeriesSettings, DefaultSettings, UUID } from '@common/lib'
import { IDatabase } from 'pg-promise'

export class SeriesRepository {
    constructor(private db: IDatabase<any>) {
        this.db = db
    }

    async setSeries(series: string): Promise<null> {
        return this.db.none(`set search_path= '${series}', 'public'`)
    }

    async seriesList(): Promise<string[]> {
        const results = await this.db.any('SELECT schema_name FROM information_schema.schemata ' +
            "WHERE schema_name NOT LIKE 'pg_%' AND schema_name NOT IN ('information_schema', 'public', 'template')")
        return results.map(v => v.schema_name)
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

    async eventList(): Promise<SeriesEvent[]> {
        return this.db.any('SELECT * FROM events')
    }

    async getEvent(eventid: UUID): Promise<SeriesEvent> {
        return this.db.one('SELECT * FROM events WHERE eventid=$1', [eventid])
    }
}
