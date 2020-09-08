import { DateString } from './util'

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
    modified: DateString;
}

export interface PaymentAccountSecret {
    accountid: string;
    secret: string;
    attr: {
        refresh: string;
        expires: DateString;
    }
    modified: DateString;
}

export interface PaymentItem {
    itemid: string;
    name: string;
    price: number;
    type: number;
    currency: string;
    modified: DateString;
}

export const ITEMTYPES = [
    { text: 'Car Entry Fee', value: 0 },
    { text: 'General Event Fee', value: 1 },
    { text: 'Series Fee/Membership', value: 2 }
]

export const ITEM_TYPE_ENTRY_FEE = 0
export const ITEM_TYPE_GENERAL_FEE = 1
export const ITEM_TYPE_SERIES_FEE = 2
