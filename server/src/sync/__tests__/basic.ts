import { getPKHash } from '../types'

test('getPK basic', () => {
    expect(getPKHash('drivers', { driverid: '12345', modified: '' })).toStrictEqual('12345')
    expect(getPKHash('runs', { eventid: 'a', carid: 'b', course: 1, rungroup: 2, run: 3, modified: '' })).toStrictEqual('a;b;1;2;3')
})
