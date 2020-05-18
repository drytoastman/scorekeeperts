import { DateString } from './util'

export interface PaymentAccount {
    accountid: string;
    name: string;
    type: string;
    attr: {
        mode: string,
        applicationid: string,
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
    accountid: string;
    name: string;
    price: number;
    currency: string;
    modified: DateString;
}
