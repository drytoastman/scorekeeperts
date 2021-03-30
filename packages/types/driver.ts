import { DataValidationRules, MaxLength, Length, isUUIDV, isEmailV, isBarcode, isTimestamp, UUID, MinLength, UTCString, isLower } from './util'

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

const username  = [Length(6, 16)]
const password  = [Length(6, 32)]
const firstname = [Length(2, 32)]
const lastname  = [Length(2, 32)]
const email     = [isEmailV]

export const DriverValidator: DataValidationRules = {
    driverid:   [isUUIDV],
    firstname:  firstname,
    lastname:   lastname,
    username:   username,
    email:      email,
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
    firstname:  firstname,
    lastname:   lastname,
    email:      email,
    username:   username,
    password:   password,
    recaptcha:  [MinLength(64)]
}

export const ResetValidator: DataValidationRules = {
    firstname:  firstname,
    lastname:   lastname,
    email:      email
}
