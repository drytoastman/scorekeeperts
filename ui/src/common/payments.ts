import { UTCString } from './util'

export interface PaymentAccount {
    accountid: string;
    name: string;
    type: string;
    attr: {
        mode: string;
        version: number;
        merchantid?: string;
        applicationid?: string;
    }
    modified: UTCString;
}

export interface PaymentAccountSecret {
    accountid: string;
    secret: string;
    attr: {
        refresh: string;
        expires: UTCString;
        applicationsecret: string;
    }
    modified: UTCString;
}

export interface PaymentItem {
    itemid: string;
    name: string;
    price: number;
    itemtype: number;
    currency: string;
    modified: UTCString;
}

export const ITEMTYPES = [
    { text: 'Car Entry Fee', value: 0 },
    { text: 'General Event Fee', value: 1 },
    { text: 'Series Fee/Membership', value: 2 }
]

export const ITEM_TYPE_ENTRY_FEE = 0
export const ITEM_TYPE_GENERAL_FEE = 1
export const ITEM_TYPE_SERIES_FEE = 2
