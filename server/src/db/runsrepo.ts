import { UUID } from '@common/util'
import { IDatabase, IMain, ColumnSet } from 'pg-promise'
import _ from 'lodash'

let runcols: ColumnSet|undefined

export class RunsRepository {
    // eslint-disable-next-line no-useless-constructor
    constructor(private db: IDatabase<any>, private pgp: IMain) {
        /*
        if (regcols === undefined) {
            regcols = new pgp.helpers.ColumnSet([
                { name: 'eventid', cnd: true, cast: 'uuid' },
                { name: 'carid',   cnd: true, cast: 'uuid' },
                'session',
                { name: 'modified', cast: 'timestamp', mod: ':raw', init: (): any => { return 'now()' } }
            ], { table: 'registered' })
        }
        */
    }

    async attendance(): Promise<{[key: string]: UUID[]}> {
        const rows = await this.db.any('SELECT DISTINCT r.eventid,c.driverid FROM runs r JOIN cars c ON c.carid=r.carid')
        const ret = {}
        for (const row of rows) {
            if (!(row.eventid in ret)) ret[row.eventid] = new Set()
            ret[row.eventid].add(row.driverid)
        }
        for (const eventid in ret) {
            ret[eventid] = Array.from(ret[eventid])
        }
        return ret
    }
}
