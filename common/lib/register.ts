import { DataValidationRules, isUUID, isDate, UUID, isSession, DateString } from './util'

export interface Registration {
    eventid: UUID;
    carid: UUID;
    session: string;
    modified: DateString;
}

export const RegValidator: DataValidationRules = {
    eventid:  [isUUID],
    carid:    [isUUID],
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
    modified: DateString;
}

export const PaymentValidator: DataValidationRules = {
    payid:    [],
    eventid:  [isUUID],
    carid:    [isUUID],
    session:  [isSession],
    refid:    [],
    txtype:   [],
    txid:     [],
    txtime:   [isDate],
    itemname: [],
    amount:   [],
    modified: [isDate]
}
