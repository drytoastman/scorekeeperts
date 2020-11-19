import { IDatabase, IMain } from 'pg-promise'
import { Challenge } from '@common/challenge'

export class ChallengeRepository {
    constructor(private db: IDatabase<any>, pgp: IMain) {
    }

    async challengeList(): Promise<Challenge[]> {
        return this.db.any('SELECT * from challenges')
    }
}
