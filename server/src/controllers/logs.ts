import _ from 'lodash'
import { Request, Response } from 'express'
import fs from 'fs'
import readLastLines from 'read-last-lines'
import util from 'util'

import { checkAuth } from './apiauth'

const readdirAsync = util.promisify(fs.readdir)

export async function logs(req: Request, res: Response) {
    if (!req.auth.hasAdminAuth()) {
        // return res.status(401).json({ error: 'not authenticated', authtype: 'admin' })
    }

    const ret = {}
    for (const file of await readdirAsync('/var/log')) {
        ret[file] = await readLastLines.read(`/var/log/${file}`, 10)
    }
    return res.json(ret)
}
