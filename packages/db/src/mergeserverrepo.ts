import { UTCString, UUID } from 'sctypes'
import { IDatabase, IMain, ColumnSet } from 'pg-promise'
import _ from 'lodash'

let mergecols: ColumnSet|undefined

export interface MergeServer {
    serverid: UUID
    hostname: string
    address: string
    lastcheck: UTCString
    nextcheck: UTCString
    waittime: number
    ctimeout: number
    cfailures: number
    hoststate: string
    mergestate: any
    quickruns: string|null
}

const LOCALID = '00000000-0000-0000-0000-000000000000'

export class MergeServerRepository {
    constructor(private db: IDatabase<any>, private pgp: IMain) {
    }

    async getActive(): Promise<MergeServer[]> {
        return this.db.any("SELECT * FROM mergeservers WHERE hoststate IN ('A', '1') and serverid!=$1", [LOCALID])
    }

    async getQuickRuns(): Promise<MergeServer[]> {
        return this.db.any("SELECT * FROM mergeservers WHERE hoststate IN ('A') AND quickruns IS NOT NULL and serverid!=$1", [LOCALID])
    }

    async getLocalMergeServer(): Promise<MergeServer> {
        return this.db.one('SELECT * FROM mergeservers WHERE serverid=$1', [LOCALID])
    }

    async updateMergeServer(server: MergeServer): Promise<null> {
        return this.db.none(this.pgp.helpers.update([server], mergecols) + ' WHERE v.serverid = t.serverid')
    }

    async updateMergeItems(server: MergeServer, items: string[]) {
        // Record select changes in the mergeservers table so we don't overwrite frontend stuff
        const args = items.map(item => `${item}=$(${item})`).join(', ')
        const stmt = `UPDATE mergeservers SET ${args} WHERE serverid=$(serverid)`
        return this.db.none(stmt, server)
    }

    async loadPassword(series: string): Promise<string> {
        return (await this.db.one('SELECT data FROM localcache WHERE name=$1', [series])).data
    }
}
