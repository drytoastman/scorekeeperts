import axios from 'axios'
import { Request } from 'express'

import { db } from '@/db'
import { RECAPTCHA_SECRET } from '@/db/generalrepo'
import { controllog } from '@/util/logging'

export async function verifyCaptcha(req: Request): Promise<void> {
    const secret = await db.general.getLocalSetting(RECAPTCHA_SECRET)
    if (req.body.admin && req.auth.hasAnySeriesAuth()) {
        return
    }
    const resp = await axios.post('https://www.google.com/recaptcha/api/siteverify', `secret=${secret}&response=${req.body.recaptcha}`)
    if (!resp.data.success) {
        throw Error(`ReCaptcha verification failed: ${resp.data['error-codes']}`)
    } else {
        controllog.info('Recaptcha vertification success')
    }
}