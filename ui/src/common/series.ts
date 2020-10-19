import { Challenge } from './challenge'
import { SeriesClass, SeriesIndex } from './classindex'
import { SeriesEvent } from './event'
import { SeriesSettings } from './settings'

export interface SeriesInfo {
    classes: SeriesClass[]
    indexes: SeriesIndex[]
    settins: SeriesSettings
    events: SeriesEvent[]
    challenges: Challenge[]
}

export enum SeriesStatus {
    ACTIVE   = 1,
    ARCHIVED = 0,
    INVALID  = -1,
    UNKNOWN  = -2
}

export class PosPoints {
    ppoints: number[]
    constructor(list: string) {
        this.ppoints = list.split(',').map(v => parseInt(v))
    }

    get(position: number): number {
        const idx = position - 1
        if (idx >= this.ppoints.length) {
            return this.ppoints[-1]
        } else {
            return this.ppoints[idx]
        }
    }
}
