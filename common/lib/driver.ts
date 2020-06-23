import { DataValidationRules, MaxLength, Length, isUUID, isEmail, isBarcode, isDate, UUID } from './util'

export interface Driver
{
    driverid: UUID;
    firstname: string;
    lastname: string;
    email: string;
    username: string;
    password: string;
    barcode: string;
    optoutmail: boolean;
    attr: {
        address: string;
        city: string;
        state: string;
        zip: string;
        phone: string;
        brag: string;
        sponsor: string;
        econtact: string;
        ephone: string;
        scca: string;
    }
    modified: Date;
    created: Date;
}

export const DriverValidator: DataValidationRules = {
    driverid:   [isUUID],
    firstname:  [Length(2, 32)],
    lastname:   [Length(2, 32)],
    email:      [isEmail],
    username:   [Length(6, 32)],
    password:   [Length(6, 32)],
    barcode:    [isBarcode],
    optoutmail: [],
    address:    [MaxLength(64)],
    city:       [MaxLength(64)],
    state:      [MaxLength(16)],
    zip:        [MaxLength(8)],
    phone:      [MaxLength(16)],
    brag:       [MaxLength(64)],
    sponsor:    [MaxLength(64)],
    econtact:   [MaxLength(64)],
    ephone:     [MaxLength(64)],
    scca:       [MaxLength(16)],
    modified:   [isDate],
    created:    [isDate]
}

export const RegisterValidator: DataValidationRules = {
    firstname:  [Length(2, 32)],
    lastname:   [Length(2, 32)],
    email:      [isEmail],
    username:   [Length(6, 32)],
    password:   [Length(6, 32)]
}

export const ResetValidator: DataValidationRules = {
    firstname:  [Length(2, 32)],
    lastname:   [Length(2, 32)],
    email:      [isEmail]
}
