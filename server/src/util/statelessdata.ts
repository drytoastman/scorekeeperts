import KeyGrip from 'keygrip'
import moment from 'moment'
import { base64encode, base64decode } from 'nodejs-base64'

/* Essentially copying what the python itsdangerous library did */

export function wrapObj(keygrip: KeyGrip, obj: any): string {
    if (!obj.expires) {
        obj.expires =  moment().add(1, 'days')
    }
    const encoded = base64encode(JSON.stringify(obj))
    return encoded + ' ' + keygrip.sign(encoded)
}

export function unwrapObj(keygrip: KeyGrip, wrapped: string): string {
    const [encoded, sig] = wrapped.split(' ')
    if (!keygrip.verify(encoded, sig)) {
        throw Error('Invalid signature')
    }
    const obj = JSON.parse(base64decode(encoded))
    if (obj.expires > moment()) {
        throw Error('This request has expired')
    }
    return obj
}
