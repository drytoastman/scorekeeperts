import _ from 'lodash'
import { IMain } from 'pg-promise'

import { EventValidator, SeriesEvent } from 'sctypes'
import { UUID, validateObj } from 'sctypes'
import { ScorekeeperProtocol, TABLES } from '.'

export class EventsRepository {
    constructor(private db: ScorekeeperProtocol, private pgp: IMain) {
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

    async updateEvents(type: string, events: SeriesEvent[]): Promise<SeriesEvent[]> {
        if (type !== 'delete') {
            events.forEach(e => validateObj(e, EventValidator))
        }

        return this.db.tx(async tx => {

            if (type === 'insert') {
                return tx.any(this.pgp.helpers.insert(events, TABLES.events) + ' RETURNING *')
            } else if ((type === 'update') || (type === 'eventupdate')) {
                return tx.any(this.pgp.helpers.update(events, TABLES.events) + ' WHERE v.eventid=t.eventid RETURNING *')
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
                return ret
            }
            throw Error(`Unknown operation type ${JSON.stringify(type)}`)
        })
    }
}
