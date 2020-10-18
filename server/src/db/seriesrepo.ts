import { IDatabase, IMain, ColumnSet } from 'pg-promise'
import { ScorekeeperProtocol } from '.'

import { SeriesSettings, DefaultSettings } from '@common/settings'
import { SeriesEvent } from '@common/event'
import { UUID } from '@common/util'
import { cleanAttr } from './helper'
import { dblog } from '@/util/logging'

let eventcols: ColumnSet|undefined
let itemmapcols: ColumnSet|undefined

export class SeriesRepository {
    constructor(private db: IDatabase<any>, private pgp: IMain) {
        if (eventcols === undefined) {
            eventcols = new pgp.helpers.ColumnSet([
                { name: 'eventid', cnd: true, cast: 'uuid' },
                { name: 'date', cast: 'date' },
                { name: 'regopened', cast: 'timestamp' },
                { name: 'regclosed', cast: 'timestamp' },
                'name', 'champrequire', 'useastiebreak', 'isexternal', 'ispro', 'ispractice',
                { name: 'regtype', cast: 'int' },
                { name: 'courses', cast: 'int' },
                { name: 'runs', cast: 'int' },
                { name: 'countedruns', cast: 'int' },
                { name: 'segments', cast: 'int' },
                { name: 'perlimit', cast: 'int' },
                { name: 'totlimit', cast: 'int' },
                { name: 'sinlimit', cast: 'int' },
                'conepen', 'gatepen', 'accountid',
                { name: 'attr',     cast: 'json', init: (col: any): any => { return cleanAttr(col.value) } },
                { name: 'modified', cast: 'timestamp', mod: ':raw', init: (): any => { return 'now()' } },
                { name: 'created',  cast: 'timestamp', init: (col: any): any => { return col.exists ? col.value : 'now()' } }
            ], { table: 'events' })
        }

        if (itemmapcols === undefined) {
            itemmapcols = new pgp.helpers.ColumnSet([
                { name: 'eventid', cnd: true, cast: 'uuid' },
                { name: 'itemid',  cnd: true, cast: 'uuid' },
                { name: 'maxcount', cast: 'int' },
                { name: 'required', cast: 'bool' },
                { name: 'modified', cast: 'timestamp', mod: ':raw', init: (): any => { return 'now()' } }
            ])
        }
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

    async eventList(): Promise<SeriesEvent[]> {
        return this.db.task(async task => {
            const ret: SeriesEvent[] = await task.any('SELECT * FROM events ORDER BY date')
            await this.loadItemMap(task, ret)
            return ret
        })
    }

    async getEvent(eventid: UUID): Promise<SeriesEvent> {
        return this.db.task(async task => {
            const ret: SeriesEvent = await task.one('SELECT * FROM events WHERE eventid=$1', [eventid])
            await this.loadItemMap(task, [ret])
            return ret
        })
    }

    private async loadItemMap(tx: ScorekeeperProtocol, events: SeriesEvent[]) {
        try {
            for (const event of events) {
                event.items = await tx.any('SELECT * FROM itemeventmap WHERE eventid=$1', [event.eventid])
            }
        } catch (error) {
            if (!process.env.OLD_DATABASE) throw error
            dblog.warn(`loadItemMap failure (${error}) but using old database so ignoring`)
        }
    }

    private async updateItemMap(tx: ScorekeeperProtocol, events: SeriesEvent[]) {
        try {
            for (const event of events) {
                await tx.none('DELETE FROM itemeventmap WHERE eventid=$1 AND itemid NOT IN ($1:csv)', [event.eventid, event.items])
                for (const itemmap of event.items) {
                    await tx.any('INSERT INTO itemeventmap (eventid, itemid, maxcount, required) ' +
                                 'VALUES ($(eventid), $(itemid), $(maxcount), $(required)) ' +
                                 'ON CONFLICT (eventid, itemid) DO NOTHING', itemmap)
                }
            }
        } catch (error) {
            if (!process.env.OLD_DATABASE) throw error
            dblog.warn(`updateItemMap failure (${error}) but using old database so ignoring`)
        }
    }

    async updateEvents(type: string, events: SeriesEvent[]): Promise<SeriesEvent[]> {
        return await this.db.tx(async tx => {
            if (type === 'insert') {
                const ret: SeriesEvent[] = await tx.any(this.pgp.helpers.insert(events, eventcols) + ' RETURNING *')
                await this.updateItemMap(tx, events)
                await this.loadItemMap(tx, ret)
                return ret
            }
            if (type === 'update') {
                await this.db.none(this.pgp.helpers.update(events, eventcols) + ' WHERE v.eventid=t.eventid')
                await this.updateItemMap(tx, events)
                // UPDATE won't return event if nothing changed, still need return for item only updates
                const ret: SeriesEvent[] = await tx.any('SELECT * FROM events WHERE eventid in ($1:csv)', events.map(e => e.eventid))
                await this.loadItemMap(tx, ret)
                return ret
            }
            if (type === 'delete') return this.db.any('DELETE from events WHERE eventid in ($1:csv) RETURNING carid', events.map(e => e.eventid))
            throw Error(`Unknown operation type ${JSON.stringify(type)}`)
        })
    }
}
