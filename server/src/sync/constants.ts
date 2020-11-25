import { pgp, SYNCTABLES } from '@/db'

export const FOREIGN_KEY_CONSTRAINT = '23503'
export const LOCAL_TIMEOUT  = 5000
export const PEER_TIMEOUT   = 8000
export const REMOTE_TIMEOUT = 60000

export const TABLE_ORDER = [
    'drivers',
    'weekendmembers',
    'timertimes',
    'settings',
    'indexlist',
    'paymentaccounts',
    'paymentitems',
    'events',
    'classlist',
    'cars',
    'registered',
    'payments',
    'runs',
    'runorder',
    'challenges',
    'challengerounds',
    'challengestaging',
    'challengeruns',
    'externalresults'
]

export const INTERTWINED_DATA = [
    'classorder'
]

export const PUBLIC_TABLES = [
    'drivers',
    'weekendmembers'
]

export const ADVANCED_UPDATE_TABLES = [
    'drivers',
    'events'
]

export function logtablefor(table: string) {
    if (PUBLIC_TABLES.includes(table)) return 'publiclog'
    return 'serieslog'
}

export async function asyncwait(ms: number) {
    return new Promise(resolve => { setTimeout(resolve, ms) })
}

function sumpart(idx: number):string  { return `sum(('x' || substring(t.rowhash, ${idx}, 8))::bit(32)::bigint) as sum${idx}` }
function sums(): string               { return `${sumpart(1)}, ${sumpart(9)}, ${sumpart(17)}, ${sumpart(25)}` }
function md5col(col: string): string  { return `md5(${col}::text)` }
function md5cols(pk: string[]): string {
    const cols = [...pk]
    cols.sort()
    cols.push('modified')
    return cols.map(col => md5col(col)).join('||')
}
function hashcommand(table: string, pklist: string[]): string {
    return `SELECT ${sums()} FROM (SELECT MD5(${md5cols(pklist)}) as rowhash from ${table}) as t`
}

export const HASH_COMMANDS: {[table: string]: string} = {}
export const PRIMARY_KEYS: {[table: string]: string[]} = {}
export const PRIMARY_SETS: {[table: string]: string} = {}
export const PRIMARY_TVEQ: {[table: string]: string} = {}
for (const table of [...TABLE_ORDER, ...INTERTWINED_DATA]) {
    PRIMARY_KEYS[table]  = SYNCTABLES[table].columns.filter(c => c.cnd).map(c => c.name)
    HASH_COMMANDS[table] = hashcommand(table, PRIMARY_KEYS[table])

    PRIMARY_SETS[table]  = PRIMARY_KEYS[table].map(key => `${key}=$(${key})`).join(' AND ')
    PRIMARY_TVEQ[table] = ' WHERE ' + PRIMARY_KEYS[table].map(key => `t.${key}=v.${key}`).join(' AND ')
}
