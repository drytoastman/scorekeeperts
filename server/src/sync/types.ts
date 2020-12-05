import { addMilliseconds } from 'date-fns'
import _ from 'lodash'

import { formatToTimestamp, parseTimestamp, UTCString } from '@/common/util'
import { PRIMARY_KEYS } from './constants'

export type PrimaryKeyHash = string
export type TableName = string

export type DBObject = {
    [key: string]: any
    created?: UTCString
    modified: UTCString
}

export type DeletedObject = {
    data: DBObject
    deletedat: Date
}

export enum SyncErrors  {
    KillSignal = 'KillSignal',
    SyncError  = 'SyncError'
}
export class KillSignalError extends Error {
    constructor() {
        super('kill signal received')
        this.name = SyncErrors.KillSignal
    }
}
export class SyncError extends Error {
    constructor(message: string) {
        super(message)
        this.name = SyncErrors.SyncError
    }
}


export function getPKHash(table: string, obj: DBObject): PrimaryKeyHash {
    const ret = [] as any[]
    for (const key of PRIMARY_KEYS[table]) {
        ret.push(obj[key])
    }
    return ret.join(';')
}

export function minmodtime(objs: Map<any, any>): Date {
    let ret = 0
    let ms
    for (const o of objs.values()) {
        ms = parseTimestamp(o.modified)
        if (ms < ret) ret = ms
    }
    return new Date(ret)
}

export function mincreatetime(objs: DBObject[], objs2: DBObject[]): Date {
    let ret = 0
    let ms
    for (const o of objs)  {
        ms = parseTimestamp(o.created || '0')
        if (ms < ret) ret = ms
    }
    for (const o of objs2) {
        ms = parseTimestamp(o.created || '0')
        if (ms < ret) ret = ms
    }
    return new Date(ret)
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
    otime: Date
    odiff: any
    adiff: any
    deletedAttr: string[]
    constructor(otime, diff) {
        this.otime = otime
        this.odiff = diff.odiff
        this.adiff = diff.adiff
        this.deletedAttr = diff.deletedAttr
    }
}


function dbObjectDiff(olddata: DBObject, newdata: DBObject) {
    const odiff = {}
    const adiff = {}
    const deletedAttr = [] as string[]
    for (const key in newdata) {
        if ((key === 'attr') || (key[0] === '_')) continue
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

function dbObjectSame(left: DBObject, right: DBObject) {
    const d = dbObjectDiff(left, right)
    return _.isEmpty(d.odiff) && _.isEmpty(d.adiff) && d.deletedAttr.length === 0
}


export class LoggedObject {
    // An object loaded from the log data insert and following updates across multiple machines
    initA: InsertObject
    initB: InsertObject
    updates = [] as UpdateObject[]
    pkhash: PrimaryKeyHash

    constructor(private table: string, pkhash: PrimaryKeyHash) {
        this.pkhash = pkhash
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
            Object.assign(data.attr, uobj.adiff)
            for (const key of uobj.deletedAttr) {
                delete data.attr[key]
            }
        }

        // Pick modified time based on object that didn't change or the final modtime + epsilon
        let both = false
        if (!dbObjectSame(last, data)) {
            both = true
            data.modified = formatToTimestamp(addMilliseconds(parseTimestamp(data.modified), 1))
        }

        return { obj: data, both: both }
    }
}
