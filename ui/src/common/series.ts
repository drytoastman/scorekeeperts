import { SeriesClass, SeriesIndex } from './classindex'
import { SeriesEvent } from './event'
import { SeriesSettings } from './settings'

export interface SeriesInfo {

    classes: SeriesClass[];
    indexes: SeriesIndex[];
    settins: SeriesSettings;
    events: SeriesEvent[];
    // challenges: Challenge[];
}

export enum SeriesStatus {
    ACTIVE   = 1,
    ARCHIVED = 0,
    INVALID  = -1,
    UNKNOWN  = -2
}
