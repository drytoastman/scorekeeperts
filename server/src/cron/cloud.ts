/* eslint-disable quotes */
import { Storage } from '@google-cloud/storage'
import _ from 'lodash'
import child from 'child_process'
import fs from 'fs'
import moment from 'moment'
import util from 'util'
import zlib from 'zlib'

const storage    = new Storage({ keyFilename: 'creds.json' })
const bucketName = 'scorekeeperbackup'

export async function backupNow() {
    const name   = `scorekeeper-${moment().format('YYYY-MM-DD-HH-mm')}.sql`
    const gz     = `${name}.gz`
    const append = util.promisify(fs.appendFile)
    const exec   = util.promisify(child.exec)
    const unlink = util.promisify(fs.unlink)

    await append(name,
        "UPDATE pg_database SET datallowconn='false' WHERE datname='scorekeeper';\n" +
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='scorekeeper';\n")
    await exec(`pg_dumpall -p 6432 -U postgres -c >> ${name}`)
    await append(name,
        "UPDATE pg_database SET datallowconn='true' WHERE datname='scorekeeper';\n")

    await new Promise<void>(resolve => {
        fs.createReadStream(name).pipe(zlib.createGzip()).pipe(fs.createWriteStream(gz)).on('finish', resolve)
    })

    const bucket = storage.bucket(bucketName)
    await bucket.upload(gz)
    await unlink(gz)
    await unlink(name)
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
