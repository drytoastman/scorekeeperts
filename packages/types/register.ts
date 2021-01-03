import { DataValidationRules, isUUIDV, isUUIDN, isTimestamp, UUID, UTCString } from './util'
import { isSession } from './event'

export interface Registration {
    eventid: UUID;
    carid: UUID;
    session: string;
    rorder: number;
    modified: UTCString;
}

export const RegValidator: DataValidationRules = {
    eventid:  [isUUIDV],
    carid:    [isUUIDV],
    session:  [isSession],
    modified: [isTimestamp]
}

export interface Payment {
    payid: string;
    eventid: UUID;
    carid: UUID;
    session: string;
    refid: string;
    txtype: string;
    txid: string;
    txtime: UTCString;
    itemname: string;
    amount: number;
    accountid: string;
    refunded: boolean;
    modified: UTCString;
}

export const PaymentValidator: DataValidationRules = {
    payid:    [],
    eventid:  [isUUIDN],
    carid:    [isUUIDN],
    session:  [isSession],
    refid:    [],
    txtype:   [],
    txid:     [],
    txtime:   [isTimestamp],
    itemname: [],
    amount:   [],
    modified: [isTimestamp]
}
