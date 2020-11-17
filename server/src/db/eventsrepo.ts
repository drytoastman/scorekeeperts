import _ from 'lodash'
import { IDatabase, IMain, ColumnSet } from 'pg-promise'
import { v1 as uuidv1 } from 'uuid'

import { EventValidator, ItemMap, SeriesEvent } from '@common/event'
import { UUID, validateObj } from '@common/util'
import { cleanAttr } from './helper'
import { ScorekeeperProtocol } from '.'

let eventcols: ColumnSet|undefined

export class EventsRepository {
    constructor(private db: ScorekeeperProtocol, private pgp: IMain) {
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


    }

    async eventList(): Promise<SeriesEvent[]> {
        return this.db.task(async task => {
            const ret: SeriesEvent[] = await task.any('SELECT * FROM events ORDER BY date')
            return ret
        })
    }

    async getEvent(eventid: UUID): Promise<SeriesEvent> {
        return this.db.task(async task => {
            const ret: SeriesEvent = await task.one('SELECT * FROM events WHERE eventid=$1', [eventid])
            return ret
        })
    }

    async updateEvents(type: string, events: SeriesEvent[]): Promise<{ itemeventmap?: ItemMap[], events: SeriesEvent[]}> {
        if (type !== 'delete') {
            events.forEach(e => validateObj(e, EventValidator))
        }

        return this.db.tx(async tx => {

            if (type === 'insert') {
                const newevents = [] as SeriesEvent[]
                let maps = [] as ItemMap[]

                for (const e of events) {
                    const eres = await tx.one(this.pgp.helpers.insert([e], eventcols) + ' RETURNING *')
                    if (e.items && e.items.length > 0) {
                        e.items.forEach(m => { m.eventid = eres.eventid })
                        maps = [...maps, ...await tx.payments.updateItemMaps('insert', eres.eventid, e.items)]
                    }
                    newevents.push(eres)
                }
                return {
                    events: newevents,
                    itemeventmap: maps
                }
            } else if ((type === 'update') || (type === 'eventupdate')) {
                return {
                    events: await tx.any(this.pgp.helpers.update(events, eventcols) + ' WHERE v.eventid=t.eventid RETURNING *')
                }
            } else if (type === 'delete') {
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
                return { events: ret }
            }
            throw Error(`Unknown operation type ${JSON.stringify(type)}`)
        })
    }
}
