import { IDatabase, ILostContext, IConnected } from 'pg-promise'
import { EventEmitter } from 'events'
import { IClient } from 'pg-promise/typescript/pg-subset'
import { dblog } from '.'

export class TableWatcher extends EventEmitter {
    tables: Set<String>
    connection: IConnected<any, IClient> | null
    shuttingdown: boolean

    constructor(private db: IDatabase<any>) {
        super()
        this.shuttingdown = false
        this.tables = new Set<String>()
    }

    shutdown() {
        this.shuttingdown = true
        this.connection && this.connection.done()
    }

    addTables(tbls: string[]) {
        tbls.forEach(t => {
            this.tables.add(t)
            if (this.connection) {
                this.connection.none('LISTEN $1~', t)
            }
        })
        if (!this.connection) {
            this.reconnect()
        }
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
                this.tables.forEach(t => {
                    conn.none('LISTEN $1~', t)
                })
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
