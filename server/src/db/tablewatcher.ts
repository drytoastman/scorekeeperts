import { IDatabase, ILostContext, IConnected } from 'pg-promise'
import { EventEmitter } from 'events'
import { IClient } from 'pg-promise/typescript/pg-subset'

export class TableWatcher extends EventEmitter {
    tables: Set<String>
    connection: IConnected<any, IClient> | null

    constructor(private db: IDatabase<any>) {
        super()
        this.tables = new Set<String>()
        this.reconnect()
    }

    addTables(tbls: string[]) {
        tbls.forEach(t => {
            this.tables.add(t)
            this.connection && this.connection.none('LISTEN $1~', t)
        })
    }

    tableChange(data) {
        const ret = this.emit(data.channel, data.payload)
    }

    reconnect() {
        const delay = 3000
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                this.db.connect({ direct: true, onLost: this.onLost }).then(conn => {
                    this.connection = conn // global connection is now available
                    resolve(conn)
                    conn.client.on('notification', this.tableChange.bind(this))
                    this.tables.forEach(t => {
                        conn.none('LISTEN $1~', t)
                    })
                }).catch(error => {
                    console.log('Error Connecting:', error)
                    this.reconnect().then(resolve).catch(reject)
                })
            }, delay)
        })
    }

    onLost(err: any, e: ILostContext<any>) {
        console.log('Connectivity Problem:', err)
        this.connection = null // prevent use of the broken connection
        e.client.removeListener('notification', this.tableChange.bind(this))
        this.reconnect().then(() => {
            console.log('Successfully Reconnected')
        }).catch(() => {
            console.log('Connection Lost Permanently')
        })
    }
}
