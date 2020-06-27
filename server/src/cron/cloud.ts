/* eslint-disable quotes */
import { Storage } from '@google-cloud/storage'
import _ from 'lodash'
import child from 'child_process'
import fs from 'fs'
import moment from 'moment'
import net from 'net'
import util from 'util'
import zlib from 'zlib'

const storage    = new Storage({ keyFilename: 'creds.json' })
const bucketName = 'scorekeeperbackup'

export function backupNow() {
    const name   = `scorekeeper-${moment().format('YYYY-MM-DD-HH-mm')}`
    const client = new net.Socket()

    console.log('starting backup ' + name)
    client.connect({ host: '127.0.0.1', port: 6666 }, () => {
        client.write(name + '\n')
    })
    client.on('data', d => {
        const s = d.toString()
        if (s.trim() === 'done') {
            console.log('backup complete')
            const path = `/var/log/${name}.sql.gz`
            const bucket = storage.bucket(bucketName)
            bucket.upload(path)
                .then(() => console.log('upload complete'))
                .catch(error => console.log('upload failure: ' + error))
                .finally(() => fs.unlink(path, () => {}))
        } else {
            console.log(`bad data back from database server: ${s}`)
        }
        client.end()
    })
}

export async function restoreBackup() {
    const files  = (await storage.bucket(bucketName).getFiles())[0]
    const latest = _(files).filter(f => !!f.name.match(/scorekeeper\S+.sql.gz/)).maxBy('metadata.timeCreated')
    if (!latest) {
        throw Error('No backups present')
    }
    console.log(`Download ${latest.name}`)
    await latest.download({ destination: latest.name })

    const sql = latest.name.substring(0, latest.name.length - 3)
    await new Promise<void>(resolve => {
        fs.createReadStream(latest.name).pipe(zlib.createGunzip()).pipe(fs.createWriteStream(sql)).on('finish', resolve)
    })

    console.log('starting restore')
    const output = await util.promisify(child.exec)(`psql -p 6432 -U postgres -f ${sql}`)
    console.log(output.stderr)

    const unlink = util.promisify(fs.unlink)
    await unlink(sql)
    await unlink(latest.name)
}
