import { CronJob } from 'cron'
import { oauthrefresh } from './squareoauth'
import { sendQueuedEmail, checkMailmanErrors } from './mailman'
import { backupNow } from './cloud'

/*
    seconds (0-59)
    minutes (0-59)
    hours (0-23)
*/
export function startJobs() {
    new CronJob('0    0  3     *  *  *', oauthrefresh).start()
    new CronJob('0    0  1,13  *  *  *', backupNow).start()
    new CronJob('*/15 *  *     *  *  *', sendQueuedEmail).start()
    new CronJob('0    0  */4   *  *  *', checkMailmanErrors).start()
}
