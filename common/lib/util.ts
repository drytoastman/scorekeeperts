import validator from 'validator'

export type UUID = string;
export type DateString = string;
export type VuetifyValidationRule  = (value: any) => string | boolean
export type VuetifyValidationRules = VuetifyValidationRule[]

export interface DataValidationRules {
    [key: string]: VuetifyValidationRules;
}

export const nonBlank: VuetifyValidationRule       = v => { return v.length > 0 || 'this field is required' }
export const isNumber: VuetifyValidationRule       = v => { return typeof v === 'number' || (typeof v === 'string' && validator.isNumeric(v)) || 'must be a number ' }
export const isURL: VuetifyValidationRule          = v => { return validator.isURL(v) || 'must be a valid URL' }
export const isEmail: VuetifyValidationRule        = v => { return validator.isEmail(v) || 'must be a valid email address' }
export const isUUID: VuetifyValidationRule         = v => { return validator.isUUID(v) || 'must be UUID' }
export const isDate: VuetifyValidationRule         = v => { return (v instanceof Date && !isNaN(v.getTime())) || 'must be a date object' }
export const isDecimal3: VuetifyValidationRule     = v => { return validator.isDecimal(v, { decimal_digits: '0,3' }) || 'must be a decimal with max 3 places' }
export const isBarcode: VuetifyValidationRule      = v => { return /^([0-9A-Z]+|)$/.test(v) || 'Barcode can only accept characters 0-9 an capital A-Z' }

export const isDollar: VuetifyValidationRule = v => {
    return  typeof v === 'number' || validator.isCurrency(v, { digits_after_decimal: [0, 1, 2] }) || 'Needs to be a valid dollar amount'
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
    return (v): (boolean|string) => { return ((min <= v.length) && (v.length <= max)) || `must be between ${min} and ${max} characters` }
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

export function validateObj(obj: any, ruleobj: DataValidationRules): boolean|object {
    const errors: any = {}
    let valid = true
    for (const key in Object.keys(ruleobj)) {
        if (key in obj) {
            errors[key] = []
            for (const rule of ruleobj[key]) {
                const res = rule(obj[key])
                if (typeof res === 'string') {
                    errors[key].push(res)
                    valid = false
                }
            }
        }
    }

    return valid || errors
}
