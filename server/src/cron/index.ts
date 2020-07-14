import { CronJob } from 'cron'
import { oauthrefresh } from './squareoauth'
import { sendQueuedEmail, checkMailmanErrors, mailmaninit } from './mailman'
import { backupNow } from './cloud'
import { cronlog } from '../util/logging'

/*
    seconds (0-59)
    minutes (0-59)
    hours (0-23)
*/
export function startCronJobs() {  // times in UTC
    cronlog.info('scheduling cron jobs')
    mailmaninit()
    new CronJob('0    0  11    *  *  *', oauthrefresh).start()  // 4am
    new CronJob('0    0  8,20  *  *  *', backupNow).start()    // 1am, 1pm
    new CronJob('*/15 *  *     *  *  *', sendQueuedEmail).start()
    new CronJob('0    0  */4   *  *  *', checkMailmanErrors).start()
}

process.on('SIGPIPE', () => {
    cronlog.info('forced backup')
    backupNow()
})
