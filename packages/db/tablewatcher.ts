import { IDatabase, ILostContext, IConnected } from 'pg-promise'
import { EventEmitter } from 'events'
import { IClient } from 'pg-promise/typescript/pg-subset'
import { dblog } from '.'

const TABLES = ['emailqueue', 'registered', 'events', 'itemeventmap', 'paymentitems', 'paymentaccounts', 'runs', 'timertimes', 'localeventstream']

export class TableWatcher extends EventEmitter {
    connection: IConnected<any, IClient> | null = null
    started: boolean
    shuttingdown: boolean

    constructor(private db: IDatabase<any>) {
        super()
        this.started = false
        this.shuttingdown = false
    }

    start() {
        this.reconnect()
    }

    shutdown() {
        this.shuttingdown = true
        this.connection && this.connection.done()
    }

    tableChange(data) {
        const jsonstart  = data.payload.indexOf('{')
        if (jsonstart > 0) {
            const [series, type] = data.payload.slice(0, jsonstart).split(',')
            const rowdata        = JSON.parse(data.payload.slice(jsonstart))
            this.emit(data.channel, series, type, rowdata)
        } else {
            this.emit(data.channel)
        }
    }

    reconnect() {
        const delay = 3000
        setTimeout(() => {
            this.db.connect({ direct: true, onLost: this.onLost.bind(this) }).then(conn => {
                this.connection = conn
                conn.client.on('notification', this.tableChange.bind(this))
                for (const t of TABLES) {
                    conn.none('LISTEN $1~', t)
                }
            }).then(() => {
                dblog.info('watcher connected')
            }).catch(error => {
                dblog.error('watcher connect error: %s', error)
                this.reconnect()
            })
        }, delay)
    }

    onLost(err: any, e: ILostContext<any>) {
        if (this.shuttingdown) {
            return
        }
        dblog.error('watcher problem:', err)
        e.client.removeAllListeners('notification')
        this.connection = null
        this.reconnect()
    }
}
