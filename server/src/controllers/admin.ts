import { Request, Response } from 'express'
import Router from 'express-promise-router'
import { db } from '../db'
// import { oauthRequest, oauthFinish, oauthRefresh } from '../util/square'
import * as square from '../util/square'
import { gCache } from '../util/cache'

export const admin = Router()
/*
admin.use(async function(req: Request, res: Response, next: Function) {
    if (!(['/login', '/slogin'].includes(req.path)) && !req.session!.driverid) {
        res.status(401).json({ result: 'login required' })
        return
    }
    next()
})
*/

admin.get('/oauthlink', async(req: Request, res: Response) => {
    try {
        const clientid = await db.payments.getSquareApplicationId()
        const state    = 'nwr2020'
        const link = `https://connect.squareupsandbox.com/oauth2/authorize?client_id=${clientid}&scope=MERCHANT_PROFILE_READ,PAYMENTS_WRITE,PAYMENTS_READ,ORDERS_WRITE,ITEMS_READ&state=${state}`

        res.send(`<a href='${link}'>Link</a>`)
    } catch (error) {
        res.status(500).json({ error: error })
    }
})

admin.get('/squareoauth', async(req: Request, res: Response) => {
    try {
        await db.task('oauth', async t => {
            try {
                console.log(req.query)
                const selections = await square.oauthRequest(t, req.query.state as string, req.query.code as string)

                let form = "<form method='post'><select name='locationid'>"
                for (const l of selections.locations) {
                    form += `<option value='${l.id}'>${l.name}</option>`
                }
                form += `</select><input type='hidden' name='requestid' value='${selections.requestid}'/>
                        <input type='submit' name='submit'/></form>`
                res.send(form)

            } catch (error) {
                console.log(error)
                res.status(500).json({ error: error })
            }
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error })
    }
})

admin.post('/squareoauth', async(req: Request, res: Response) => {
    try {
        await db.task('oauthfinish', async t => {
            await square.oauthFinish(t, req.body.requestid, req.body.locationid)
            res.send('ok')
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error })
    }
})


admin.get('/crontest', async(req: Request, res: Response) => {
    try {
        await db.task('oauthfinish', async t => {
            for (const series of await t.series.seriesList()) {
                t.series.setSeries(series)
                for (const account of await t.payments.getPaymentAccounts()) {
                    if (account.type === 'square') {
                        await square.oauthRefresh(t, account)
                    }
                }
            }
            res.send('ok')
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error })
    }
})
