import { UUID } from '@common/lib'
import { IDatabase } from 'pg-promise'

export async function verifyDriverRelationship(db: IDatabase<any>, carids: UUID[], driverid: UUID): Promise<void> {
    if (carids.length > 0) {
        const dids = await db.any('SELECT DISTINCT driverid FROM cars WHERE carid IN ($1:csv)', carids)
        if ((dids.length !== 1) || (dids[0].driverid !== driverid)) {
            throw Error('Attemping to modifiy another drivers data')
        }
    }
}
