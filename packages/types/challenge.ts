import { UUID } from './util'

export interface Challenge {
    challengeid: UUID
    eventid:     UUID
    name:        string
    depth:       number
     modified:    string
}

export interface ChallengeRound {
    challengeid:  UUID
    round:        number
    swappedstart: boolean
    car1id:       UUID|null
    car1dial:     number
    car2id:       UUID|null
    car2dial:     number
    modified:     string
}

export interface ChallengeRun {
    challengeid: UUID
    round:       number
    carid:       UUID
    course:      number
    reaction:    number
    sixty:       number
    raw:         number
    cones:       number
    gates:       number
    status:      string
    modified:    string
    // decorate
    net: number
}

export interface SideResult {
    carid: UUID
    dial: number
    newdial: number
    firstname: string
    lastname: string
    classcode: string
    indexcode: string
    left: ChallengeRun|null
    right: ChallengeRun|null
    result: number
}

export interface RoundResult {
    challengeid: UUID
    round: number
    winner: number
    detail: string
    e1: SideResult
    e2: SideResult
}

export type ChallengeResults = {[key: string]: RoundResult}

const RANK1 =  [1]
const RANK2 =  [2, 1]
const RANK4 =  [3, 2, 4, 1]
const RANK8 =  [6, 3, 7, 2, 5, 4, 8, 1]
const RANK16 = [11, 6, 14, 3, 10, 7, 15, 2, 12, 5, 13, 4, 9, 8, 16, 1]
const RANK32 = [22, 11, 27, 6, 19, 14, 30, 3, 23, 10, 26, 7, 18, 15, 31, 2, 21, 12, 28, 5, 20, 13, 29, 4, 24, 9, 25, 8, 17, 16, 32, 1]
export const RANKS =  [...RANK32, ...RANK16, ...RANK8, ...RANK4, ...RANK2, ...RANK1, 0].reverse()
