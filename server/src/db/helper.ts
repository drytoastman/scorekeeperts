import { IDatabase } from 'pg-promise'
import { UUID } from '@common/util'

export async function verifyDriverRelationship(db: IDatabase<any>, carids: UUID[], driverid: UUID): Promise<void> {
    if (carids.length > 0) {
        const dids = await db.any('SELECT DISTINCT driverid FROM cars WHERE carid IN ($1:csv)', carids)
        if ((dids.length !== 1) || (dids[0].driverid !== driverid)) {
            throw Error('Attemping to modifiy another drivers data')
        }
    }
}

/**
 * Remove nulls, blanks, zeros, etc to reduce attr size
 */
export function cleanAttr(obj: {[key:string]: any}): any {
    const ret = {}
    for (const key in obj) {
        let val = obj[key]
        if (typeof val === 'string') {
            val = val.trim()
        }
        if (val) ret[key] = val
    }
    return ret
}

