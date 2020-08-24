import _ from 'lodash'
import AdmZip from 'adm-zip'
import { Request, Response } from 'express'
import fs from 'fs'
import readLastLines from 'read-last-lines'
import util from 'util'

const readdirAsync = util.promisify(fs.readdir)
const readfileAsync = util.promisify(fs.readFile)

export async function logs(req: Request, res: Response) {
    req.auth.requireAdmin()

    const linecount = req.query.lines || 10
    const download = 'separate' in req.query
    const interleave = 'interleave' in req.query
    const files = (await readdirAsync('/var/log')).filter(f => f.endsWith('.log') && !f.startsWith('access'))

    if (!download && !interleave) {
        const ret = {}
        for (const file of files) {
            ret[file] = await readLastLines.read(`/var/log/${file}`, linecount)
        }
        return res.json(ret)
    }

    if (download) {
        const ret = {}
        const zip = new AdmZip()
        for (const file of files) {
            zip.addLocalFile(`/var/log/${file}`)
        }

        res.setHeader('Content-disposition', 'attachment; filename=logs.zip')
        res.contentType('application/zip')
        return res.send(zip.toBuffer())
    }

    if (interleave) {
        const ret:string[] = []

        for (const file of files) {
            const data = await readfileAsync(`/var/log/${file}`, 'utf-8')
            const lines = data.split('\n')
            for (const line of lines) {
                if (line[0] !== '2') { // NOT starting with 202 something
                    const lidx = ret.length - 1
                    ret[lidx] = ret[lidx] + 'EOL' + line
                    continue
                }

                let endidx = 20
                if (line[10] === 'T') {
                    endidx = 26 // deal with ISO format with timezone
                } else if (line.substr(20, 3) === 'PDT') {  // FINISH ME do TZ search instead
                    endidx = 24
                }

                ret.push(
                    line.substr(0, 19).replace(/\//g, '-').replace('T', ' ') +
                    ` ${file} `.padEnd(12, ' ') +
                    line.substr(endidx)
                )
            }
        }

        res.setHeader('Content-disposition', 'attachment; filename=interleaved.log')
        res.contentType('text/plain')
        return res.send(_(ret).sortBy(v => v.substr(0, 19)).map(v => v.replace(/EOL/g, '\n\t')).join('\n'))
    }
}
