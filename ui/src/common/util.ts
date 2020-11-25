import _V from './validataorimport'
import { format, parse, subMinutes } from 'date-fns'

export type UUID = string;
export type DateString = string;
export type UTCString = string;
export type VuetifyValidationRule  = (value: any) => string | boolean
export type VuetifyValidationRules = VuetifyValidationRule[]

export function parseDate(date: DateString):          Date { return parse(date, 'yyyy-MM-dd', new Date()) }
export function parseTimestamp(timestamp: UTCString): Date { return new Date(timestamp) }
export function formatToTimestamp(val: Date): string       { return format(val, "yyyy-MM-dd'T'HH:mm:ss") }
export function formatToMsTimestamp(val: Date): string     { return format(val, "yyyy-MM-dd'T'HH:mm:ss.SSSSSS") }
export function parseTimestampLocal(timestamp: UTCString): Date {
    const t = parseTimestamp(timestamp)
    return subMinutes(t, t.getTimezoneOffset())
}

export interface DataValidationRules {
    [key: string]: VuetifyValidationRules;
}

export const nonBlank: VuetifyValidationRule   = v => { return v.length > 0 || 'this field is required' }
export const isNumber: VuetifyValidationRule   = v => { return typeof v === 'number' || (typeof v === 'string' && _V.isNumeric(v)) || 'must be a number ' }
export const isEmailV: VuetifyValidationRule   = v => { return _V.isEmail(v) || 'must be a valid email address' }
export const isUUIDV: VuetifyValidationRule    = v => { return _V.isUUID(v) || 'must be UUID' }
export const isUUIDN: VuetifyValidationRule    = v => { return v === null || _V.isUUID(v) || 'must be UUID or null' }
export const isDate: VuetifyValidationRule      = v => { return (parseDate(v).getTime() >= 0) || 'must be date string (yyyy-MM-dd)' }
export const isTimestamp: VuetifyValidationRule = v => { return (parseTimestamp(v).getTime() >= 0) || 'must be an ISO date value' }
export const isBarcode: VuetifyValidationRule  = v => { return /^([0-9A-Z]+|)$/.test(v) || 'barcode can only accept characters 0-9 an capital A-Z' }
export const isDomain: VuetifyValidationRule   = v => { return _V.isFQDN(v) || 'not a valid domain name' }
export const isAlphaNum: VuetifyValidationRule = v => { return _V.isAlphanumeric(v) || 'must be alpha numeric' }
export const isOneZero: VuetifyValidationRule  = v => { return ['0', '1'].includes(v) || 'must be 1 or 0' }
export const isLower: VuetifyValidationRule    = v => { return _V.isLowercase(v) || 'must be lowercase' }


export const isURLV: VuetifyValidationRule      = v => {
    return (v === undefined) || (v === '') || _V.isURL(v) || 'must be a valid URL'
}

export const isInteger: VuetifyValidationRule  = v => {
    return (v === undefined) || typeof v === 'number' || _V.isInt(v) || 'must be an integer'
}

export const isDecimal3: VuetifyValidationRule = v => {
    return (v === undefined) || typeof v === 'number' || _V.isDecimal(v, { decimal_digits: '0,3' }) || 'must be a decimal with max 3 places'
}

export const isDollar: VuetifyValidationRule = v => {
    return (v === undefined) || typeof v === 'number' || _V.isCurrency(v, { digits_after_decimal: [0, 1, 2] }) || 'must be a valid dollar amount'
}

export function isPrintable(allowblank: boolean): VuetifyValidationRule {
    return (v): (boolean|string) => {
        if (allowblank && v === undefined) return true
        const isString = typeof v === 'string' || v instanceof String
        const quant = allowblank ? '*' : '+'
        const re = new RegExp(`^[ -~]${quant}$`, 'i')
        return (isString && re.test(v)) || 'must be ascii printable characters'
    }
}

export function Min(n: number): VuetifyValidationRule {
    return (v): (boolean|string) => { return v >= n || `must greater than or equal to ${n}` }
}

export function Max(n: number): VuetifyValidationRule {
    return (v): (boolean|string) => { return v <= n || `must less than or equal to ${n}` }
}

export function Range(min: number, max: number): VuetifyValidationRule {
    return (v): (boolean|string) => { return ((min <= v) && (v <= max)) || `must be between ${min} and ${max}` }
}

export function MinLength(len: number): VuetifyValidationRule {
    return (v): (boolean|string) => { return v.length >= len || `must be at least ${len} characters` }
}

export function MaxLength(len: number): VuetifyValidationRule {
    return (v): (boolean|string) => { return (v === undefined || v.length <= len) || `cannot be more than ${len} characters` }
}

export function Length(min: number, max: number): VuetifyValidationRule {
    return (v): (boolean|string) => { return (v === undefined) || ((min <= v.length) && (v.length <= max)) || `must be between ${min} and ${max} characters` }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function validateValue(value: any, rules: VuetifyValidationRules): boolean|string {
    for (const rule of rules) {
        const res = rule(value)
        if (typeof res === 'string') {
            return res
        }
    }
    return true
}

export function validateObj(obj: {[key:string]: any}, ruleobj: DataValidationRules): void {
    for (const key of Object.keys(ruleobj)) {
        if (key in obj) {
            for (const rule of ruleobj[key]) {
                const res = rule(obj[key])
                if (typeof res === 'string') {
                    throw Error(`in object member '${key}', ${res}`)
                }
            }
        }
    }
}
