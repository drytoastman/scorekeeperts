import { CronJob } from 'cron'
import { oauthrefresh } from './squareoauth'
import { sendEmail } from './mailman'

// seconds (0-59, minutes (0-59), hours (0-23), day of month (1-31), month (0-11), day of week (0-6)
export function startJobs() {
    new CronJob('0     0  3  *  *  *', oauthrefresh).start()
    new CronJob('0,30  *  *  *  *  *', sendEmail).start()
}
