import isNumeric from 'validator/es/lib/isNumeric'
import isEmail from 'validator/es/lib/isEmail'
import isISO8601 from 'validator/es/lib/isISO8601'
import isURL from 'validator/es/lib/isURL'
import isUUID from 'validator/es/lib/isUUID'
import isInt from 'validator/es/lib/isInt'
import isDecimal from 'validator/es/lib/isDecimal'
import isCurrency from 'validator/es/lib/isCurrency'

export type UUID = string;
export type DateString = string;
export type VuetifyValidationRule  = (value: any) => string | boolean
export type VuetifyValidationRules = VuetifyValidationRule[]

export interface DataValidationRules {
    [key: string]: VuetifyValidationRules;
}

export const nonBlank: VuetifyValidationRule   = v => { return v.length > 0 || 'this field is required' }
export const isNumber: VuetifyValidationRule   = v => { return typeof v === 'number' || (typeof v === 'string' && isNumeric(v)) || 'must be a number ' }
export const isEmailV: VuetifyValidationRule   = v => { return isEmail(v) || 'must be a valid email address' }
export const isUUIDV: VuetifyValidationRule    = v => { return isUUID(v) || 'must be UUID' }
export const isDate: VuetifyValidationRule     = v => { return (v instanceof Date && !isNaN(v.getTime())) || 'must be a date object' }
export const isBarcode: VuetifyValidationRule  = v => { return /^([0-9A-Z]+|)$/.test(v) || 'Barcode can only accept characters 0-9 an capital A-Z' }
export const isISODate: VuetifyValidationRule  = v => { return isISO8601(v) || 'Not a valid ISO Date value' }

export const isURLV: VuetifyValidationRule      = v => {
    return (v === undefined) || (v === '') || isURL(v) || 'must be a valid URL'
}

export const isInteger: VuetifyValidationRule  = v => {
    return (v === undefined) || typeof v === 'number' || isInt(v) || 'must be an integer'
}

export const isDecimal3: VuetifyValidationRule = v => {
    return (v === undefined) || typeof v === 'number' || isDecimal(v, { decimal_digits: '0,3' }) || 'must be a decimal with max 3 places'
}

export const isDollar: VuetifyValidationRule = v => {
    return (v === undefined) || typeof v === 'number' || isCurrency(v, { digits_after_decimal: [0, 1, 2] }) || 'Needs to be a valid dollar amount'
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
    return (v): (boolean|string) => { return v.length >= len || `must greater than ${len} characters` }
}

export function MaxLength(len: number): VuetifyValidationRule {
    return (v): (boolean|string) => { return (v === undefined || v.length <= len) || `must less than ${len} characters` }
}

export function Length(min: number, max: number): VuetifyValidationRule {
    return (v): (boolean|string) => { return (v === undefined) || ((min <= v.length) && (v.length <= max)) || `must be between ${min} and ${max} characters` }
}

export function validateValue(value: any, rules: VuetifyValidationRules): boolean|string {
    for (const rule of rules) {
        const res = rule(value)
        if (typeof res === 'string') {
            return res
        }
    }
    return true
}

export function validateObj(obj: any, ruleobj: DataValidationRules): void {
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
