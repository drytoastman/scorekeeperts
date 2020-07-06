import _ from 'lodash'
import { Request, Response } from 'express'
import fs from 'fs'
import nunjucks from 'nunjucks'
import puppeteer from 'puppeteer-core'
import util from 'util'

import { UUID, SeriesEvent, SeriesSettings } from '@common/lib'
import { checkAuth } from './apiauth'
import { db } from '../db'

interface RegData
{
    g: {
        event: SeriesEvent
        settings: SeriesSettings
    }
    registered: any[]
    barcodescript: string
}

nunjucks.configure('public', {
    autoescape: true
})

let chromepath = '/headless-shell/headless-shell'
if (process.env.NODE_ENV === 'development') {
    chromepath = 'c:/chromium/chrome.exe'
}


function loadRegData(series: string, eventid: UUID): Promise<RegData> {
    return db.task('apiget', async t => {
        await t.series.setSeries(series)

        const settings = await t.series.seriesSettings()
        const event    = await t.series.getEvent(eventid)
        event.date     = new Date(event.date).toDateString()
        const reg      = await t.register.getFullEventRegistration(eventid, false)

        reg.forEach(v => {
            if (v.carid) {
                // quickid is first portion of UUID converted to base 10 and prepadded with zeros
                const q = `${parseInt(v.carid.substr(0,  8), 16)}`.padStart(10, '0')
                v.quickentry = `${q.substr(0, 3)} ${q.substr(3, 3)} ${q.substr(6, 4)}`

                // UUID in base 10 with extra zeros to make 40 digits which fits into 128C
                // eslint-disable-next-line no-undef
                v.caridbarcode = `${BigInt('0x' + v.carid.split('-').join(''))}`.padStart(40, '0')
            }
        })

        return {
            g: {
                event: event,
                settings: settings
            },
            registered: reg,
            barcodescript: ''
        }
    })
}


export async function cardtemplate(req: Request, res: Response) {
    let param
    try {
        param = checkAuth(req)
    } catch (error) {
        return res.status(401).json({ error: error.message, authtype: error.authtype })
    }

    try {
        const reg = await loadRegData(param.series, req.query.eventid as string)
        reg.barcodescript = '<script type="text/javascript" src="/public/JsBarcode.code128.3.1.1.min.js"></script>'
        res.send(nunjucks.render('cards.html', reg))
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}


export async function cardpdf(req: Request, res: Response) {
    let param
    try {
        param = checkAuth(req)
    } catch (error) {
        return res.status(401).json({ error: error.message, authtype: error.authtype })
    }

    try {
        const read = util.promisify(fs.readFile)
        const reg = await loadRegData(param.series, req.query.eventid as string)
        reg.barcodescript = '<script type="text/javascript">\n' + await read('public/JsBarcode.code128.3.1.1.min.js', 'utf-8') + '\n</script>'
        const html = nunjucks.render('cards.html', reg)

        const browser = await puppeteer.launch({ executablePath: chromepath })
        const page    = await browser.newPage()
        await page.setContent(html, { waitUntil: 'load' })
        const buffer  = await page.pdf({ width: '8in', height: '5in', margin: { top: '5mm', bottom: '3mm', left: '3mm', right: '5mm' } })

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="${reg.g.event.name}.pdf"`)
        res.write(buffer)
        res.end()
        browser.close()
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ error: error.message })
    }
}
