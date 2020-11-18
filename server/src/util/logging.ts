/* eslint-disable array-bracket-spacing */
import fs from 'fs'
import moment from 'moment'
import winston, { format } from 'winston'
import util from 'util'

const transports = [
    new winston.transports.Console({ level: (process.env.NODE_ENV === 'development') ? 'silly' : 'warn' }),
    new winston.transports.File({ level: 'verbose', filename: '/var/log/server.log' })
]
const atransports = [
    new winston.transports.Console({ level: 'silly', silent: true }) // turn on when needed
]

// rotate our logs
export async function rotateLogs() {
    const loglabel = moment().format('YYYY-MM-DD')
    const renameAsync  = util.promisify(fs.rename)

    async function rotate(name: string) {
        const local = `/var/log/${name}.log`
        const dated = `/var/log/${loglabel}-${name}.log`
        cronlog.debug(`rename ${local} to ${dated}`)
        try {
            await renameAsync(local, dated)
        } catch (error) {
            cronlog.warn(`Unable to move ${local}: ${error}`)
        }
    }

    // rotate and reopen our local file transports
    for (const t of [...transports, ...atransports]) {
        try {
            if ('filename' in t) {
                const ta:any = t
                await rotate(ta.filename.replace('.log', ''))
                ta.open()
            }
        } catch (error) {
            cronlog.warn(`Unable to rotate/reopen ${t.name}: ${error}`)
        }
    }

    // FINISH ME: helper while we still have python, remove later
    rotate('scweb')
}

const singleline = format.printf(({ level, message, label, timestamp, stack }) => {
    if (stack) {
        return `${timestamp} [${label}/${level}]: ${message}\n${stack}`
    }
    return `${timestamp} [${label}/${level}]: ${message}`
})

const formats = [
    format.splat(),
    format.errors({ stack: true }),
    format.timestamp({
        format: function() { return moment().format('YYYY-MM-DD HH:mm:ss') }
    }),
    singleline
]

// primary logging
for (const l of ['main', 'database', 'cron', 'control', 'payments', 'dns']) {
    winston.loggers.add(l, {
        format: format.combine(format.label({ label: l }), ...formats),
        transports: transports
    })
}
export const mainlog = winston.loggers.get('main')
export const dblog = winston.loggers.get('database')
export const cronlog = winston.loggers.get('cron')
export const controllog = winston.loggers.get('control')
export const paymentslog = winston.loggers.get('payments')
export const dnslog = winston.loggers.get('dns')

// logging just for access much like nginx access log
winston.loggers.add('access', {
    format: format.combine(format.label({ label: 'access' }), ...formats),
    transports: atransports
})
export const accesslog = winston.loggers.get('access')
