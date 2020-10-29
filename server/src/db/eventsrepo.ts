import { IDatabase, IMain, ColumnSet } from 'pg-promise'
import { v1 as uuidv1 } from 'uuid'
import { ScorekeeperProtocol } from '.'

import { EventValidator, SeriesEvent } from '@common/event'
import { UUID, validateObj } from '@common/util'
import { cleanAttr } from './helper'
import { dblog } from '@/util/logging'

let eventcols: ColumnSet|undefined
let itemmapcols: ColumnSet|undefined

export class EventsRepository {
    constructor(private db: IDatabase<any>, private pgp: IMain) {
        if (eventcols === undefined) {
            eventcols = new pgp.helpers.ColumnSet([
                { name: 'eventid', cnd: true, cast: 'uuid', init: (col: any): any => { return col.exists ? col.value : uuidv1() } },
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
        for (const event of events) {
            event.items = await tx.any('SELECT * FROM itemeventmap WHERE eventid=$1', [event.eventid])
        }
    }

    private async updateItemMap(tx: ScorekeeperProtocol, events: SeriesEvent[]) {
        for (const event of events) {
            await tx.none(`DELETE FROM itemeventmap WHERE eventid=$1 ${event.items.length > 0 ? 'AND itemid NOT IN ($2:csv)' : ''}`, [event.eventid, event.items])
            for (const itemmap of event.items) {
                itemmap.eventid = event.eventid // make sure
                await tx.any('INSERT INTO itemeventmap (eventid, itemid, maxcount, required) ' +
                                 'VALUES ($(eventid), $(itemid), $(maxcount), $(required)) ' +
                                 'ON CONFLICT (eventid, itemid) DO NOTHING', itemmap)
            }
        }
    }

    async updateEvents(type: string, events: SeriesEvent[]): Promise<SeriesEvent[]> {
        if (type !== 'delete') {
            events.forEach(e => validateObj(e, EventValidator))
        }

        return await this.db.tx(async tx => {
            if (type === 'insert') {
                const ret: SeriesEvent[] = await tx.any(this.pgp.helpers.insert(events, eventcols) + ' RETURNING *')
                ret.map((e, ii) => { events[ii].eventid = e.eventid })
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
            if (type === 'delete') {
                return this.db.tx(async tx => {
                    const ret = [] as SeriesEvent[]
                    for (const e of events) {
                        await tx.none('DELETE from registered WHERE eventid=$1', [e.eventid])
                        ret.push(await tx.one('DELETE from events WHERE eventid=$1 RETURNING eventid', [e.eventid]).catch(error => {
                            if (error.constraint) {
                                switch (error.table) {
                                    case 'payments': throw Error(`There are still payments attached to ${e.name}, cannot delete event`)
                                    case 'runorder': throw Error(`There are still cars into the runorder for ${e.name}, cannot delete event`)
                                    case 'runs':     throw Error(`There are still runs recorded for ${e.name}, cannot delete event`)
                                }
                            }
                            throw error
                        }))
                    }
                    return ret
                })
            }
            throw Error(`Unknown operation type ${JSON.stringify(type)}`)
        })
    }
}