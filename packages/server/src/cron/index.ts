import { CronJob } from 'cron'
import { oauthrefresh } from './squareoauth'
import { sendQueuedEmail, checkMailmanErrors } from './mailman'
import { backupNow, rotatedLogUpload } from './cloud'
import { cronlog } from '../util/logging'
import { runSyncOnce } from '@/sync/process'
import { tableWatcher } from 'scdb'

export const CRON_MAIN_SERVER = 0x01
export const CRON_SYNC_SERVER = 0x02
const jobs: CronJob[] = []

export function startCronJobs(modeflags: number) {  // times in local time zone
    cronlog.info('scheduling cron jobs')

    /*
        seconds (0-59)
        minutes (0-59)
        hours (0-23)
    */

    if (modeflags & CRON_MAIN_SERVER) {
        jobs.push(new CronJob('0    0  4    * * *', oauthrefresh))
        jobs.push(new CronJob('0    0  1,13 * * *', backupNow))
        jobs.push(new CronJob('0 */15  *    * * *', sendQueuedEmail))
        jobs.push(new CronJob('0    0  */4  * * *', checkMailmanErrors))
        jobs.push(new CronJob('30  59  23   * * *', rotatedLogUpload))

        tableWatcher.addTables(['emailqueue'])
        tableWatcher.on('emailqueue', () => {
            sendQueuedEmail()
        })
    }

    if (modeflags & CRON_SYNC_SERVER) {
        jobs.push(new CronJob('*/10 *  *    * * *', runSyncOnce))
    }

    for (const j of jobs) {
        j.start()
    }
}

export function stopCronJobs() {
    for (const j of jobs) {
        j.stop()
    }
}

process.on('SIGPIPE', () => {
    cronlog.info('forced backup')
    backupNow()
})

process.on('SIGHUP', () => {
    cronlog.info('force sync')
    runSyncOnce()
})
