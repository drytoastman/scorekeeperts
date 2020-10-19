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
