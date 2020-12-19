import { ScorekeeperProtocolDB } from '.'
import { IMain } from 'pg-promise'
import { Challenge } from 'sctypes'

export class ChallengeRepository {
    constructor(private db: ScorekeeperProtocolDB, private pgp: IMain) {
    }

    async challengeList(): Promise<Challenge[]> {
        return this.db.any('SELECT * from challenges')
    }
}
