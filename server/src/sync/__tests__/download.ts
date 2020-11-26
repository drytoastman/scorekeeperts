
import { v1 as uuidv1 } from 'uuid'

import { pgp } from '@/db'
import { ONESHOT } from '../mergeserver'
import { runSyncOnce } from '../process'
import { DB1, getTestDB, RESET, testids } from './helpers'

afterAll(async () => {
    pgp.end()
})

test('test series download if environment available', async () => {
    const hostname = process.env.DOWNLOAD_HOST
    const series   = process.env.DOWNLOAD_SERIES
    const password = process.env.DOWNLOAD_PASSWORD
    if (!hostname || !series || !password) {
        return // skip test, no parameters to use
    }

    const syncdb = getTestDB(DB1)
    await syncdb.task(async task => {
        await task.any(RESET, testids) // in case its still in there
        await task.any(RESET, { series: series, seriespassword: password })
        await task.series.setSeries(series)
        await task.none("INSERT INTO mergeservers(serverid, hostname, address, ctimeout) VALUES ('00000000-0000-0000-0000-000000000000', 'localhost', '127.0.0.1', 10)")
        await task.none("INSERT INTO mergeservers(serverid, hostname, address, ctimeout, hoststate) VALUES ($1, $2, '', $3, $4)", [uuidv1(), hostname, 10, ONESHOT])

        await runSyncOnce(syncdb)
        await task.none('DROP SCHEMA IF EXISTS $1:raw CASCADE', [series])

        const res = await task.one('select mergestate->$1 as state from mergeservers where hostname=$2', [series, hostname])
        expect(res.state.error).toBeUndefined()
    })
}, 20000)
