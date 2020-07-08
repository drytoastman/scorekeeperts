import _ from 'lodash'
import csvstringify from 'csv-stringify'
import { Request, Response } from 'express'
import fs from 'fs'
import nunjucks from 'nunjucks'
import puppeteer from 'puppeteer-core'
import util from 'util'

import { UUID, SeriesEvent, SeriesSettings } from '@common/lib'
import { checkAuth } from './apiauth'
import { db } from '../db'
import { controllog } from '../util/logging'

interface RegData
{
    g: {
        event: SeriesEvent
        settings: SeriesSettings
    }
    registered: any[]
    barcodescript: string
}

nunjucks.configure('templates', {
    autoescape: true
})


let chromeargs: puppeteer.LaunchOptions
if (process.platform === 'win32') {
    // Running dev in Windows
    chromeargs = {
        executablePath: 'c:/chromium/chrome.exe'
    }
} else {
    // running shell in container
    chromeargs = {
        executablePath: '/headless-shell/headless-shell',
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
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


async function cardtemplate(regData: RegData, res: Response) {
    try {
        regData.barcodescript = '<script type="text/javascript" src="/public/JsBarcode.code128.3.1.1.min.js"></script>'
        res.send(nunjucks.render('cards.html', regData))
    } catch (error) {
        controllog.error(error)
        return res.status(500).json({ error: error.message })
    }
}


async function cardpdf(regData: RegData, res: Response) {
    try {
        const read = util.promisify(fs.readFile)
        regData.barcodescript = '<script type="text/javascript">\n' + await read('public/JsBarcode.code128.3.1.1.min.js', 'utf-8') + '\n</script>'
        const html = nunjucks.render('cards.html', regData)

        const browser = await puppeteer.launch(chromeargs)
        const page    = await browser.newPage()
        await page.setContent(html, { waitUntil: 'load' })
        const buffer  = await page.pdf({ width: '8in', height: '5in', margin: { top: '5mm', bottom: '3mm', left: '3mm', right: '5mm' } })

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="${regData.g.event.name}.pdf"`)
        res.write(buffer)
        res.end()
        browser.close()
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ error: error.message })
    }
}

async function cardcsv(regData: RegData, res: Response) {

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${regData.g.event.name}.csv"`)

    const stringifier = csvstringify({
        columns: ['driverid', 'lastname', 'firstname', 'email', 'address', 'city', 'state', 'zip', 'phone', 'sponsor', 'brag',
            'carid', 'year', 'make', 'model', 'color', 'number', 'classcode', 'indexcode', 'quickentry'],
        header: true
    })

    stringifier.on('readable', () => {
        let row: any
        while ((row = stringifier.read())) {
            res.write(row)
        }
    })
    stringifier.on('finish', function() {
        res.end()
    })

    for (const r of regData.registered) {
        stringifier.write(r)
    }
    stringifier.end()
}


export async function cards(req: Request, res: Response) {
    let param: { series: string; eventid: string; order: any; cardtype: any }
    try {
        param = checkAuth(req)
    } catch (error) {
        return res.status(401).json({ error: error.message, authtype: error.authtype })
    }

    const regData = await loadRegData(param.series, param.eventid)
    const firstNameSorter = r => r.firstname.toLowerCase()
    const lastNameSorter  = r => r.lastname.toLowerCase()

    switch (param.order) {
        case 'lastname':    regData.registered = _.sortBy(regData.registered, [lastNameSorter, firstNameSorter]); break
        case 'classnumber': regData.registered = _.sortBy(regData.registered, ['classcode', 'number']); break
        default: return res.status(400).json({ error: `invalid order provided "${param.order}"` })
    }

    switch (param.cardtype) {
        case 'template': return cardtemplate(regData, res)
        case 'pdf':      return cardpdf(regData, res)
        case 'csv':      return cardcsv(regData, res)
        default: return res.status(400).json({ error: `invalid cardtype provideded "${param.cardtype}"` })
    }
}
