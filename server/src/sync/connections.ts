import fs from 'fs'
import { pgp, ScorekeeperProtocolDB } from '@/db'
import { MergeServer } from '@/db/mergeserverrepo'

const dbmap = new Map<string, ScorekeeperProtocolDB>()

export function getRemoteDB(remote: MergeServer, series: string, password: string): ScorekeeperProtocolDB {
    let address = remote.address
    let port    = 54329

    if (address && address.indexOf(':') > 0) {
        const parts = remote.address.split(':')
        address = parts[0]
        port    = parseInt(parts[1])
    }

    const cn = {
        host: address || remote.hostname,
        port: port,
        database: 'scorekeeper',
        user: series,
        password: password,
        application_name: 'syncremote'
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
