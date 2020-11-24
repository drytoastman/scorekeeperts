import _ from 'lodash'
import { addSeconds } from 'date-fns'

import { formatToTimestamp, UTCString } from '@/common/util'
import { PRIMARY_KEYS } from './constants'
import { ScorekeeperProtocol } from '@/db'
import { synclog } from '@/util/logging'

export type PrimaryKey = any[]
export type PrimaryKeyHash = string
export type TableName = string

export type DBObject = {
    [key: string]: any
    created?: UTCString
    modified: UTCString
}

export type DeletedObject = {
    data: DBObject
    otime: Date
}

export const KillSignal = 'KillSignal'
export class KillSignalError extends Error {
    constructor() {
        super('kill signal received')
        this.name = KillSignal
    }
}

export function getPK(table: string, obj: DBObject): PrimaryKey {
    const ret = [] as any[]
    for (const key of PRIMARY_KEYS[table]) {
        ret.push(obj[key])
    }
    return ret
}

export function getPKHash(table: string, obj: DBObject): PrimaryKeyHash {
    const pk = getPK(table, obj)
    return pk.join(';')
}


class InsertObject {
    ltime: Date
    otime: Date
    data: DBObject
    constructor(otime: Date, ltime: Date, newdata: DBObject) {
        this.otime = otime
        this.ltime = ltime
        this.data = newdata
    }
}

class UpdateObject {
    odiff
    adiff
    deletedAttr
    constructor(time, diff) {
    }
}

class PresentObject {
    constructor(table, pk, data) {
    }
}

function dbObjectDiff(olddata: DBObject, newdata: DBObject) {
    const odiff = {}
    const adiff = {}
    const deletedAttr = [] as string[]
    for (const key in newdata) {
        if (key === 'attr') continue
        if (newdata[key] !== olddata[key]) {
            odiff[key] = newdata[key]
        }
    }
    for (const key in newdata.attr) {
        if (newdata.attr[key] !== olddata.attr[key]) {
            adiff[key] = newdata.attr[key]
        }
    }
    for (const key in olddata.attr) {
        if (!(key in newdata.attr)) {
            deletedAttr.push(key)
        }
    }

    return { odiff, adiff, deletedAttr }
}

function dbObjectIsSame(olddata: DBObject, newdata: DBObject) {
    const res = dbObjectDiff(olddata, newdata)
    return _.isEmpty(res.odiff) && _.isEmpty(res.adiff) && _.isEmpty(res.deletedAttr)
}


export class LoggedObject {
    // An object loaded from the log data insert and following updates across multiple machines
    initA: InsertObject
    initB: InsertObject
    updates = [] as UpdateObject[]

    constructor(private table: string, private pk: PrimaryKey) {
    }

    insert(otime: Date, ltime: Date, newdata: DBObject) {
        if (!this.initA) {
            this.initA = new InsertObject(otime, ltime, newdata)
            return
        }
        if (!this.initB) {
            this.initB = new InsertObject(otime, ltime, newdata)
            return
        }

        throw Error('inserted thrice?')
    }

    update(time: Date, olddata: DBObject, newdata: DBObject) {
        this.updates.push(new UpdateObject(time, dbObjectDiff(olddata, newdata)))
    }

    finalize(last: DBObject) {
        let data
        // Later insert becomes an update to catch any potential changes outside our purview
        if (this.initA.ltime < this.initB.ltime) {
            data = _.cloneDeep(this.initA.data)
            this.update(this.initB.otime, this.initA.data, this.initB.data)
        } else {
            data = _.cloneDeep(this.initB.data)
            this.update(this.initA.otime, this.initB.data, this.initA.data)
        }

        // And rebuild the object with all of the updates
        for (const uobj of _.orderBy(this.updates, 'otime')) {
            Object.assign(data, uobj.odiff)
            data.attr.update(uobj.adiff)
            for (const key of uobj.deletedAttr) {
                delete data.attr[key]
            }
        }

        // Pick modified time based on object that didn't change or the final modtime + epsilon
        let both = false
        if (!_.isEqual(last.data, data)) {
            both = true
            data.modified = formatToTimestamp(addSeconds(new Date(data.modified), 1))
        }

        return [new PresentObject(this.table, this.pk, data), both]
    }
}

async function loadLoggedFrom(task: ScorekeeperProtocol, objmap: Map<PrimaryKey, LoggedObject>, pkset, src, table, when) {

    for (const obj of await task.any('SELECT * FROM $1:sql WHERE tablen=$2 and otime>=$3 ORDER BY otime', [src, table, when])) {
        if (obj.action === 'I') {
            const pk = getPK(table, obj.newdata)
            if (!objmap.has(pk) && !pkset.has(pk)) { objmap.set(pk, new LoggedObject(table, pk)) }
            if (objmap.has(pk)) {
                objmap.get(pk)?.insert(obj.otime, obj.ltime, obj.newdata)
            }
        } else if (obj.action === 'U') {
            const pk = getPK(table, obj.newdata)
            if (objmap.has(pk)) {
                objmap.get(pk)?.update(obj.otime, obj.olddata, obj.newdata)
            }
        } else if (obj.action === 'D') {
            const pk = getPK(table, obj.olddata)
            if (objmap.has(pk)) {
                throw Error('LoggedObject delete is invalid')
            }
        } else {
            synclog.warning('How did we get here?')
        }
    }
}
