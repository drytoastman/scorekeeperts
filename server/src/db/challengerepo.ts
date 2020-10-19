import { IDatabase, IMain, ColumnSet } from 'pg-promise'
import { Challenge } from '@common/challenge'

let challengecols: ColumnSet|undefined

export class ChallengeRepository {
    constructor(private db: IDatabase<any>, pgp: IMain) {
        if (challengecols === undefined) {
            challengecols = new pgp.helpers.ColumnSet([
                { name: 'challengeid', cnd: true, cast: 'uuid' },
                { name: 'eventid', cast: 'uuid' },
                { name: 'name' },
                { name: 'depth' },
                { name: 'modified', cast: 'timestamp', mod: ':raw', init: (): any => { return 'now()' } }
            ])
        }
    }

    async challengeList(): Promise<Challenge[]> {
        return this.db.any('SELECT * from challenges')
    }
}
