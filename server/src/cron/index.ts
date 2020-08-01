import { CronJob } from 'cron'
import { oauthrefresh } from './squareoauth'
import { sendQueuedEmail, checkMailmanErrors, mailmaninit } from './mailman'
import { backupNow, logRotateUpload } from './cloud'
import { cronlog } from '../util/logging'

/*
    seconds (0-59)
    minutes (0-59)
    hours (0-23)
*/
export function startCronJobs() {  // times in local time zone
    cronlog.info('scheduling cron jobs')
    mailmaninit()
    /* eslint-disable no-new */
    new CronJob('0    0  4    * * *', oauthrefresh).start()
    new CronJob('0    0  1,13 * * *', backupNow).start()
    new CronJob('*/15 *  *    * * *', sendQueuedEmail).start()
    new CronJob('0    0  */4  * * *', checkMailmanErrors).start()
    new CronJob('30  59  23   * * *', logRotateUpload).start()
    /* eslint-enable no-new */
}

process.on('SIGPIPE', () => {
    cronlog.info('forced backup')
    backupNow()
})
