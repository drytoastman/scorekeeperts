/* eslint-disable quotes */
import { Storage, StorageOptions } from '@google-cloud/storage'
import _ from 'lodash'
import child from 'child_process'
import fs from 'fs'
import moment from 'moment'
import net from 'net'
import util from 'util'
import zlib from 'zlib'
import { cronlog, reopenLogs } from '@/util/logging'
import { sendLogs } from './mailman'

let config: StorageOptions | undefined
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
    client.connect({ host: 'db', port: 6666 }, () => {
        client.write(name + '\n')
    })
    client.on('data', d => {
        const s = d.toString()
        if (s.trim() === 'done') {
            cronlog.info('backup complete')
            const path = `/var/log/${name}.sql.gz`
            const bucket = storage.bucket(backupBucket)
            bucket.upload(path)
                .then(() => cronlog.info('upload complete'))
                .catch(error => cronlog.error('upload failure: ' + error))
                .finally(() => fs.unlink(path, () => {}))
        } else {
            cronlog.info(`bad data back from database server: ${s}`)
        }
        client.end()
    })
}


const unlinkAsync  = util.promisify(fs.unlink)
const renameAsync  = util.promisify(fs.rename)
const readdirAsync = util.promisify(fs.readdir)

export async function logRotateUpload() {
    const loglabel = moment().format('YYYY-MM-DD')
    const torotate = ['serverall', 'serverwarn', 'scweb', 'postgres']

    // nginx will rotate itself 30 seconds earlier so it can reopen files
    for (const name of torotate) {
        const local = `/var/log/${name}.log`
        const dated = `/var/log/${loglabel}-${name}.log`
        cronlog.debug(`rename ${local} to ${dated}`)
        try {
            await renameAsync(local, dated)
        } catch (error) {
            cronlog.warn(`Unable to move ${local}`)
            continue
        }
    }

    cronlog.info('starting log upload')
    const bucket   = storage.bucket(logBucket)
    const files    = await readdirAsync('/var/log')
    const toupload = files.filter(f => f[0] === '2').map(f => `/var/log/${f}`)
    const toemail  = toupload.filter(f => /(nginxerror|serverwarn|postgres)/.test(f))

    for (const path of toupload) {
        try {
            await bucket.upload(path)
            cronlog.info(`upload of ${path} complete`)
        } catch (error) {
            cronlog.error(`upload of ${path} failed: ` + error)
        }
    }

    await sendLogs(toemail)
    for (const path of toupload) {
        await unlinkAsync(path)
    }

    reopenLogs()
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
