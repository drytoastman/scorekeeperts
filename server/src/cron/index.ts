import { CronJob } from 'cron'
import { oauthrefresh } from './squareoauth'
import { sendQueuedEmail, checkMailmanErrors } from './mailman'
import { backupNow, rotatedLogUpload } from './cloud'
import { cronlog } from '../util/logging'
import { runSyncOnce } from '@/sync/process'

export const CRON_MAIN_SERVER = 0x01
export const CRON_SYNC_SERVER = 0x02

export function startCronJobs(modeflags: number) {  // times in local time zone
    cronlog.info('scheduling cron jobs')

    /*
        seconds (0-59)
        minutes (0-59)
        hours (0-23)
    */

    if (modeflags & CRON_MAIN_SERVER) {
        new CronJob('0    0  4    * * *', oauthrefresh).start()
        new CronJob('0    0  1,13 * * *', backupNow).start()
        new CronJob('*/15 *  *    * * *', sendQueuedEmail).start()
        new CronJob('0    0  */4  * * *', checkMailmanErrors).start()
        new CronJob('30  59  23   * * *', rotatedLogUpload).start()
    }

    if (modeflags & CRON_SYNC_SERVER) {
        new CronJob('*/10 *  *    * * *', runSyncOnce).start()
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
