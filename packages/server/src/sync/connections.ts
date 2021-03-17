import fs from 'fs'
import { db, pgp, ScorekeeperProtocolDB } from 'scdb'
import { PEER_TIMEOUT, REMOTE_TIMEOUT } from './constants'

const dbmap = new Map<string, ScorekeeperProtocolDB>()

export function getLocalDB(): ScorekeeperProtocolDB {
    return pgp(Object.assign({}, db.$cn, { application_name: 'synclocal' }))
}

export function getRemoteDB(remote: { address?: string, hostname: string }, series: string, password: string): ScorekeeperProtocolDB {
    let address = remote.address
    let port    = 54329

    if (address && address.indexOf(':') > 0) {
        const parts = address.split(':')
        address = parts[0]
        port    = parseInt(parts[1])
    }

    const cn = {
        host: address || remote.hostname,
        port: port,
        database: 'scorekeeper',
        user: series,
        password: password,
        application_name: 'syncremote',
        idle_in_transaction_session_timeout: address ? PEER_TIMEOUT : REMOTE_TIMEOUT
    } as any

    if (port === 54329) {
        cn.ssl =  {
            ca: fs.readFileSync('/certs/root.cert').toString(),
            key: fs.readFileSync('/certs/server.key').toString(),
            cert: fs.readFileSync('/certs/server.cert').toString(),
            rejectUnauthorized: false
            // checkServerIdentity: (hostname, cert) => {}
        }
    }

    const key = [cn.host, cn.port, cn.user, cn.password].join(';')
    if (!dbmap.has(key)) {
        dbmap.set(key, pgp(cn))
    }
    return dbmap.get(key) as ScorekeeperProtocolDB
}
