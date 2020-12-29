import KeyGrip from 'keygrip'
import moment from 'moment-timezone'

/* Essentially copying what the python itsdangerous library did */

export function wrapObj(keygrip: KeyGrip, obj: any): string[] {
    if (!obj.expires) {
        obj.expires =  moment().add(1, 'days')
    }

    const encoded = Buffer.from(JSON.stringify(obj), 'utf8').toString('base64')
    return [encoded, keygrip.sign(encoded)]
}

export function unwrapObj(keygrip: KeyGrip, encoded: string, sig: string): any {
    if (!keygrip.verify(encoded, sig)) {
        throw Error('Invalid token signature')
    }
    const obj     =  JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'))
    const expires = moment(obj.expires).tz(process.env.TZ || 'America/Los_Angeles')
    if (expires < moment()) {
        throw Error(`This token expired ${expires.format('llll z')}`)
    }
    return obj
}
