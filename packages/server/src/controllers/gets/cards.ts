import _ from 'lodash'
import csvstringify from 'csv-stringify'
import { Request, Response } from 'express'
import fs from 'fs'
import nunjucks from 'nunjucks'
import puppeteer from 'puppeteer-core'
import util from 'util'

import { db } from 'scdb'
import { SeriesSettings } from 'sctypes/settings'
import { SeriesEvent } from 'sctypes/event'
import { errString, UUID } from 'sctypes/util'
import { controllog } from '@/util/logging'

import { AuthError, checkAuth } from '../auth'

const asyncRead = util.promisify(fs.readFile)

interface RegData
{
    g: {
        event: SeriesEvent
        settings: SeriesSettings
    }
    registered: any[]
    barcodescript: string
}


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


function loadRegData(series: string, eventid: UUID, loadEntrants: boolean): Promise<RegData> {
    return db.task('apiget', async t => {
        await t.series.setSeries(series)

        const settings = await t.series.seriesSettings()
        const event    = await t.events.getEvent(eventid)
        let reg: any[] = [{}]

        if (loadEntrants)  {
            reg = await t.register.getFullEventRegistration(eventid, false)
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
        }

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


/**
 * This is used so infrequently, we create a new environment each time so there is no
 * overlap of data between requests and the system can free the memory later
 */
class MemLoader extends nunjucks.Loader {
    constructor(private cardspage: string, private cardtemplate: string) {
        super()
    }

    getSource(tempname: string): nunjucks.LoaderSource {
        const ret = {
            src: `unknown template '${tempname}'`,
            path: tempname,
            noCache: false
        }
        switch (tempname) {
            case 'cardspage':  ret.src = this.cardspage; break
            case 'singlecard': ret.src = this.cardtemplate; break
        }
        return ret
    }
}

async function cardHTML(regData: RegData): Promise<string> {
    const cardspage   = await asyncRead('templates/cards.html', 'utf-8')
    let cardtemplate = regData.g.settings.cardtemplate
    if (!cardtemplate) {
        cardtemplate = await asyncRead('templates/defaultcard.html', 'utf-8')
    }
    const renderer = new nunjucks.Environment(new MemLoader(cardspage, cardtemplate))
    return renderer.render('cardspage', regData)
}


async function cardtemplate(regData: RegData, series: string, res: Response) {
    try {
        regData.barcodescript = '<script type="text/javascript" src="/public/JsBarcode.code128.3.1.1.min.js"></script>'
        res.send(await cardHTML(regData))
    } catch (error) {
        controllog.error(error)
        return res.status(500).json({ error: errString(error) })
    }
}


async function cardpdf(regData: RegData, series: string, res: Response) {
    try {
        regData.barcodescript = '<script type="text/javascript">\n' + await asyncRead('public/JsBarcode.code128.3.1.1.min.js', 'utf-8') + '\n</script>'
        const html    = await cardHTML(regData)
        const browser = await puppeteer.launch(chromeargs)
        const page    = await browser.newPage()
        await page.setContent(html, { waitUntil: 'load' })
        const buffer  = await page.pdf({ width: '8in', height: '5in', margin: { top: '5mm', bottom: '3mm', left: '3mm', right: '5mm' }})

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="${regData.g.event.name}.pdf"`)
        res.write(buffer)
        res.end()
        browser.close()
    } catch (error) {
        controllog.error(error)
        return res.status(500).json({ error: errString(error) })
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
        if (error instanceof AuthError) {
            return res.status(401).json({ error: error.message, authtype: error.authtype })
        } else {
            return res.status(500).json({ error: errString(error) })
        }
    }

    const regData = await loadRegData(param.series, param.eventid, param.order !== 'blank')
    const firstNameSorter = r => r.firstname.toLowerCase()
    const lastNameSorter  = r => r.lastname.toLowerCase()

    switch (param.order) {
        case 'lastname':    regData.registered = _.sortBy(regData.registered, [lastNameSorter, firstNameSorter]); break
        case 'classnumber': regData.registered = _.sortBy(regData.registered, ['classcode', 'number']); break
        case 'blank': break
        default: return res.status(400).json({ error: `invalid order provided "${param.order}"` })
    }

    switch (param.cardtype) {
        case 'template': return cardtemplate(regData, param.series, res)
        case 'pdf':      return cardpdf(regData, param.series, res)
        case 'csv':      return cardcsv(regData, res)
        default: return res.status(400).json({ error: `invalid cardtype provideded "${param.cardtype}"` })
    }
}
