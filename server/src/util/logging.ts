/* eslint-disable array-bracket-spacing */
import winston, { format } from 'winston'

const line1 = format.printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}/${level}]: ${message}`
})

const transports = [
    new winston.transports.Console({ level: (process.env.NODE_ENV === 'development') ? 'silly' : 'warn' }),
    new winston.transports.File({ level: 'verbose', filename: '/var/log/serverall.log' }),
    new winston.transports.File({ level: 'warn', filename: '/var/log/serverwarn.log' })
]

export function reopenLogs() {
    for (const t of transports) {
        if ('open' in t) {  // reopen openable transports (File)
            (t as any).open()
        }
    }
}

const formats = [
    format.splat(),
    format.timestamp(),
    line1
]

winston.loggers.add('main', {
    format: format.combine(format.label({ label: 'main' }), ...formats),
    transports: transports
})
export const mainlog = winston.loggers.get('main')

winston.loggers.add('database', {
    format: format.combine(format.label({ label: 'database' }), ...formats),
    transports: transports
})
export const dblog = winston.loggers.get('database')

winston.loggers.add('cron', {
    format: format.combine(format.label({ label: 'cron' }), ...formats),
    transports: transports
})
export const cronlog = winston.loggers.get('cron')

winston.loggers.add('control', {
    format: format.combine(format.label({ label: 'control' }), ...formats),
    transports: transports
})
export const controllog = winston.loggers.get('control')

winston.loggers.add('payments', {
    format: format.combine(format.label({ label: 'payments' }), ...formats),
    transports: transports
})
export const paymentslog = winston.loggers.get('payments')
