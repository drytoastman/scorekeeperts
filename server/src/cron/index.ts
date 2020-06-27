import { CronJob } from 'cron'
import { oauthrefresh } from './squareoauth'
import { sendQueuedEmail, checkMailmanErrors } from './mailman'
import { backupNow } from './cloud'

/*
    seconds (0-59)
    minutes (0-59)
    hours (0-23)
*/
export function startJobs() {  // times in UTC
    new CronJob('0    0  11    *  *  *', oauthrefresh).start()  // 4am
    new CronJob('0    0  8,20  *  *  *', backupNow).start()    // 1am, 1pm
    new CronJob('*/15 *  *     *  *  *', sendQueuedEmail).start()
    new CronJob('0    0  */4   *  *  *', checkMailmanErrors).start()
}
