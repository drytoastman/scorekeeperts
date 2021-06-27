/* eslint-disable quotes */
import { Storage } from '@google-cloud/storage'
import _ from 'lodash'
import child from 'child_process'
import fs from 'fs'
import moment from 'moment'
import net from 'net'
import util from 'util'
import zlib from 'zlib'
import { cronlog } from '@/util/logging'

let config: any
if (fs.existsSync('creds.json')) {
    config = { keyFilename: 'creds.json' }
}
const storage      = new Storage(config)
const backupBucket = 'scorekeeperbackup'
const logBucket    = 'scorekeeperlogs'

export function backupNow() {
    const name   = `scorekeeper-${moment().format('YYYY-MM-DD-HH-mm')}`
    const client = new net.Socket()

    cronlog.info('starting backup %s', name)
    client.on('data', async d => {
        const s = d.toString()
        if (s.trim() === 'done') {
            cronlog.info('backup complete')
            const path = `/var/log/${name}.sql.gz`
            if (fs.existsSync(path)) {
                const bucket = storage.bucket(backupBucket)
                try {
                    await bucket.upload(path)
                    cronlog.info('upload complete')
                } catch (error) {
                    cronlog.error('upload failure: ' + error)
                    cronlog.verbose(error.stack)
                } finally {
                    fs.unlink(path, () => { /**/ })
                }
            } else {
                cronlog.error(`backup file "${path}" was not present in /var/log after getting done back`)
            }
        } else {
            cronlog.error(`bad data back from database server: ${s}`)
        }
        client.end()
    })

    client.on('close',  () => { cronlog.info('backup socket closed') })
    client.on('error',  error => { cronlog.error('backup socket error: ' + error.toString()) })

    client.connect({ host: 'db', port: 6666 }, () => {
        client.write(name + '\n')
    })
}


const unlinkAsync  = util.promisify(fs.unlink)
const readdirAsync = util.promisify(fs.readdir)

export async function rotatedLogUpload() {
    // Upload anything that has been rotated to 2*.log during the day
    cronlog.info('starting log upload')
    const bucket   = storage.bucket(logBucket)
    const files    = await readdirAsync('/var/log')
    const toupload = files.filter(f => f[0] === '2').map(f => `/var/log/${f}`)
    for (const path of toupload) {
        try {
            await bucket.upload(path)
            cronlog.info(`upload of ${path} complete`)
        } catch (error) {
            cronlog.error(`upload of ${path} failed: ` + error)
        }
    }

    for (const path of toupload) {
        await unlinkAsync(path)
    }
}


export async function restoreBackup() {
    const files  = (await storage.bucket(backupBucket).getFiles())[0]
    const latest = _(files).filter(f => !!f.name.match(/scorekeeper\S+.sql.gz/)).maxBy('metadata.timeCreated')
    if (!latest) {
        throw Error('No backups present')
    }
    cronlog.info(`Download ${latest.name}`)
    await latest.download({ destination: latest.name })

    const sql = latest.name.substring(0, latest.name.length - 3)
    await new Promise<void>(resolve => {
        fs.createReadStream(latest.name).pipe(zlib.createGunzip()).pipe(fs.createWriteStream(sql)).on('finish', resolve)
    })

    cronlog.info('starting restore')
    const output = await util.promisify(child.exec)(`psql -p 6432 -U postgres -f ${sql}`)
    cronlog.debug(output.stderr)

    const unlink = util.promisify(fs.unlink)
    await unlink(sql)
    await unlink(latest.name)
}
