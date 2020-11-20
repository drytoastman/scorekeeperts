import { TABLES } from '@/db'

export const LOCAL_TIMEOUT  = 5
export const PEER_TIMEOUT   = 8
export const REMOTE_TIMEOUT = 60
export const APP_TIME_LIMIT = 3.0
export const WEB_TIME_LIMIT = 5.0

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
    'challenges',
    'challengerounds',
    'challengestaging',
    'challengeruns',
    'externalresults'
]

export const INTERTWINED_DATA = [
    'classorder',
    'runorder'
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
for (const table of [...TABLE_ORDER, ...INTERTWINED_DATA]) {
    PRIMARY_KEYS[table]  = TABLES[table].columns.filter(c => c.cnd).map(c => c.name)
    HASH_COMMANDS[table] = hashcommand(table, PRIMARY_KEYS[table])
}

export const KillSignal = 'KillSignal'
export class KillSignalError extends Error {
    constructor() {
        super('kill signal received')
        this.name = KillSignal
    }
}
