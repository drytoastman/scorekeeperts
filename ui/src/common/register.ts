import { DataValidationRules, isUUIDV, isUUIDN, isDate, UUID, DateString } from './util'
import { isSession } from './event'

export interface Registration {
    eventid: UUID;
    carid: UUID;
    session: string;
    rorder: number;
    modified: DateString;
}

export const RegValidator: DataValidationRules = {
    eventid:  [isUUIDV],
    carid:    [isUUIDV],
    session:  [isSession],
    modified: [isDate]
}

export interface Payment {
    payid: string;
    eventid: UUID;
    carid: UUID;
    session: string;
    refid: string;
    txtype: string;
    txid: string;
    txtime: DateString;
    itemname: string;
    amount: number;
    accountid: string;
    refunded: boolean;
    modified: DateString;
}

export const PaymentValidator: DataValidationRules = {
    payid:    [],
    eventid:  [isUUIDN],
    carid:    [isUUIDV],
    session:  [isSession],
    refid:    [],
    txtype:   [],
    txid:     [],
    txtime:   [isDate],
    itemname: [],
    amount:   [],
    modified: [isDate]
}
