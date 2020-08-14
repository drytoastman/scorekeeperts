import _ from 'lodash'
import AdmZip from 'adm-zip'
import { Request, Response } from 'express'
import fs from 'fs'
import readLastLines from 'read-last-lines'
import util from 'util'

const readdirAsync = util.promisify(fs.readdir)
const readfileAsync = util.promisify(fs.readFile)

export async function logs(req: Request, res: Response) {
    if (!req.auth.hasAdminAuth()) {
        return res.status(401).json({ error: 'not authenticated', authtype: 'admin' })
    }

    const lines = req.query.lines || 10
    const download = 'separate' in req.query
    const interleave = 'interleave' in req.query

    if (!download && !interleave) {
        const ret = {}
        for (const file of await readdirAsync('/var/log')) {
            ret[file] = await readLastLines.read(`/var/log/${file}`, lines)
        }
        return res.json(ret)
    }

    if (download) {
        const ret = {}
        const zip = new AdmZip()
        for (const file of await readdirAsync('/var/log')) {
            zip.addLocalFile(`/var/log/${file}`)
        }

        res.setHeader('Content-disposition', 'attachment; filename=logs.zip')
        res.contentType('application/zip')
        return res.send(zip.toBuffer())
    }

    if (interleave) {
        const ret:string[] = []

        for (const file of await readdirAsync('/var/log')) {
            const data = await readfileAsync(`/var/log/${file}`, 'utf-8')
            const lines = data.split('\n')
            for (const line of lines) {
                ret.push(line.substr(0, 19).replace(/\//g, '-') + ` ${file} `.padEnd(15, ' ') + line.substr(20))
            }
        }

        ret.sort()
        res.setHeader('Content-disposition', 'attachment; filename=interleaved.log')
        res.contentType('text/plain')
        return res.send(ret.join('\n'))
    }
}
