import { db, ScorekeeperProtocolDB } from 'scdb'
import SerialPort from 'serialport'
import dgram from 'dgram'

declare global {
    interface Window {
        db: ScorekeeperProtocolDB,
        sp: typeof SerialPort,
        dg: typeof dgram
    }
}

window.db = db
window.sp = SerialPort
window.dg = dgram
