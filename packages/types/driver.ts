import { DataValidationRules, MaxLength, Length, isUUIDV, isEmailV, isBarcode, isTimestamp, UUID, MinLength, UTCString } from './util'

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
    modified: UTCString;
    created: UTCString;
}

export const DriverValidator: DataValidationRules = {
    driverid:   [isUUIDV],
    firstname:  [Length(2, 32)],
    lastname:   [Length(2, 32)],
    email:      [isEmailV],
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
    modified:   [isTimestamp],
    created:    [isTimestamp]
}

export const RegisterValidator: DataValidationRules = {
    firstname:  [Length(2, 32)],
    lastname:   [Length(2, 32)],
    email:      [isEmailV],
    username:   [Length(6, 32)],
    password:   [Length(6, 32)],
    recaptcha:  [MinLength(64)]
}

export const ResetValidator: DataValidationRules = {
    firstname:  [Length(2, 32)],
    lastname:   [Length(2, 32)],
    email:      [isEmailV]
}
