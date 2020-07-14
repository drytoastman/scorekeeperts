import { DataValidationRules, Length, isURLV, VuetifyValidationRule, Range } from './util'

export interface SeriesSettings
{
    seriesname: string;
    emaillistid: string;
    largestcarnumber: number;
    minevents: number;
    dropevents: number;
    classinglink: string;
    seriesruleslink: string;
    requestrulesack: boolean;
    requestbarcodes: boolean;
    usepospoints: boolean;
    pospointlist: string;
    indexafterpenalties: boolean;
    superuniquenumbers: boolean;
    doweekendmembers: boolean;
    weekendregion: string;
    weekendmin: number;
    weekendmax: number;
    resultscss: string;
    resultsheader: string;
    cardtemplate: string;
}

export class DefaultSettings implements SeriesSettings {
    seriesname = ''
    emaillistid = ''
    largestcarnumber = 1999
    minevents = 0
    dropevents = 2
    classinglink = ''
    seriesruleslink = ''
    requestrulesack = false
    requestbarcodes = false
    usepospoints = false
    pospointlist = '20,16,13,11,9,7,6,5,4,3,2,1'
    indexafterpenalties = false
    superuniquenumbers = false
    doweekendmembers = false
    weekendregion = ''
    weekendmin = 0
    weekendmax = 0
    resultscss = ''
    resultsheader = ''
    cardtemplate = ''
}

export const isPosPoints: VuetifyValidationRule = v => { return /^([0-9, ]+|)$/.test(v) || 'Position points can only accept characters 0-9, comma and space' }

export const SettingsValidator: DataValidationRules = {
    seriesname:       [Length(2, 64)],
    emaillistid:      [Length(2, 16)],
    largestcarnumber: [Range(99, 10000)],
    minevents:        [Range(0, 100)],
    dropevents:       [Range(0, 100)],
    classinglink:     [isURLV],
    seriesruleslink:  [isURLV],
    requestrulesack:  [],
    requestbarcodes:  [],
    usepospoints:     [],
    pospointlist:     [isPosPoints],
    indexafterpenalties: [],
    superuniquenumbers:  [],
    doweekendmembers:    [],
    weekendregion:       [],
    weekendmin:          [],
    weekendmax:          [],
    resultscss:          [],
    resultsheader:       [],
    cardtemplate:        []
}
