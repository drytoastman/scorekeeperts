import { IMain } from 'pg-promise'
import { ScorekeeperProtocol } from '.'
import { SeriesSettings, DefaultSettings, SettingsValidator,  ActivityEntry, SeriesStatus, UUID, validateObj, getD } from 'sctypes'

export class SeriesRepository {
    constructor(private db: ScorekeeperProtocol, private pgp: IMain) {
    }

    async getCurrent(): Promise<string> {
        const res = await this.db.one('SHOW search_path')
        return res.search_path.split(',')[0]
    }

    async getStatus(series: string): Promise<SeriesStatus> {
        if (await this.db.oneOrNone('select schema_name from information_schema.schemata where schema_name=$1', [series])) {
            return SeriesStatus.ACTIVE
        } else {
            const res2 = await this.db.one('select count(1) from results where series=$1', [series])
            if (res2.count >= 2) return SeriesStatus.ARCHIVED
        }
        return SeriesStatus.INVALID
    }

    async setSeries(series: string, assertActive?: boolean): Promise<null> {
        const schema = ['public']
        if (series) {
            if (assertActive) {
                if ((await this.getStatus(series)) !== SeriesStatus.ACTIVE) {
                    throw Error(`${series} is not an active series`)
                }
            }
            schema.unshift(series)
        }
        return this.db.none('set search_path=$1:csv', [schema])
    }

    async checkSeriesLogin(series: string, password: string): Promise<void> {
        if ((await this.db.one('SELECT data FROM localcache WHERE name=$1', [series])).data !== password) {
            throw Error('Invalid password')
        }
    }

    async seriesList(): Promise<string[]> {
        const results = await this.db.any('SELECT schema_name FROM information_schema.schemata ' +
            "WHERE schema_name NOT LIKE 'pg_%' AND schema_name NOT IN ('information_schema', 'public', 'template')")
        return results.map(v => v.schema_name).sort()
    }

    async allSeries(): Promise<string[]> {
        const results = await this.db.map('SELECT schema_name FROM information_schema.schemata UNION SELECT DISTINCT series FROM results', [], r => r.schema_name)
        return results.filter(s => !['pg_catalog', 'information_schema', 'public', 'template'].includes(s)).sort()
    }

    async emailListIds(): Promise<string[]> {
        const ids = new Set<string>()
        for (const series of await this.seriesList()) {
            const results = await this.db.any('SELECT val FROM $1:name.settings WHERE name=\'emaillistid\'', series)
            results.forEach(r => ids.add(r.val))
        }
        return Array.from(ids.values()).sort()
    }

    _db2obj(key: string, val: string, obj: SeriesSettings): void {
        // Convert from text columns to local data type
        if (!(key in obj)) {
            obj[key] = val
        } else if (typeof (obj[key])  === 'boolean') {
            obj[key] = (val === '1')
        } else if (typeof (obj[key]) === 'number') {
            obj[key] = parseInt(val)
        } else {
            obj[key] = val
        }
    }

    _obj2db(def: SeriesSettings, key: string, val: any): string {
        // Convert from local data type back into text columns
        if (!(key in def)) { return val.toString() } else if (typeof (def[key]) === 'boolean') { return val ? '1' : '0' }
        return val.toString()
    }

    async superUniqueNumbers(): Promise<boolean> {
        return (await this.db.one("SELECT val FROM settings WHERE name='superuniquenumbers'")) === '1'
    }

    async seriesSettings(): Promise<SeriesSettings> {
        const ret: SeriesSettings = new DefaultSettings()
        const rows = await this.db.any('SELECT name,val FROM settings')
        for (const r of rows) {
            this._db2obj(r.name, r.val, ret)
        }
        return ret
    }

    async updateSettings(settings: SeriesSettings): Promise<SeriesSettings> {
        validateObj(settings, SettingsValidator)

        const def: SeriesSettings = new DefaultSettings()
        await this.db.tx(async tx => {
            for (const key in settings) {
                const val = this._obj2db(def, key, settings[key])
                await tx.none('INSERT INTO settings (name,val) VALUES ($1,$2) ON CONFLICT (name) DO UPDATE SET val=$3,modified=now()', [key, val, val])
            }
        })
        return this.seriesSettings()
    }

    async getLastTimer(): Promise<number|undefined> {
        const row = await this.db.oneOrNone('SELECT raw FROM timertimes ORDER BY modified DESC LIMIT 1')
        if (row) return row.raw
        return undefined
    }

    async dropSeries(series: string) {
        return await this.db.tx(async tx => {
            await tx.none('DROP SCHEMA $1:name CASCADE', [series])
            await tx.none('DROP USER $1:name', [series])
        })
    }

    async changePassword(series: string, oldpassword: string, newpassword: string) {
        const current = await this.db.one('select data from localcache where name=$1', [series], r => r.data)
        if (current !== oldpassword) { throw Error('Old password does not match') }
        return this.db.one('select verify_user($1, $2)', [series, newpassword])
    }

    async forcePassword(series: string, newpassword: string) {
        return this.db.one('select verify_user($1, $2)', [series, newpassword])
    }

    async copySeries(current: string, series: string, password: string, options: {[key: string]: boolean}) {
        // Create a new series and copy over from info from the current
        if (await this.getStatus(series) !== SeriesStatus.INVALID) {
            throw Error(`${series} already exists`)
        }

        return this.db.tx(async tx => {
            await tx.one('select verify_user($1, $2)', [series, password])
            await tx.one('select verify_series($1)', [series])
            await tx.series.setSeries(series)

            if (options.settings) {
                await tx.none('insert into $1:name.settings (select * from $2:name.settings)', [series, current])
            }

            if (options.classes) {
                await tx.none('insert into $1:name.indexlist (select * from $2:name.indexlist)', [series, current])
                await tx.none('insert into $1:name.classlist (select * from $2:name.classlist)', [series, current])
                if (options.cars) {
                    await tx.none('insert into $1:name.cars (select * from $2:name.cars)', [series, current])
                }
            } else {
                //  Need a blank index and HOLD class regardless of copying, fixes bug #78
                await tx.clsidx.updateIndexes('insert', [{
                    indexcode: '',
                    descrip: 'No Index',
                    value: 1.0
                }])
                await tx.clsidx.updateClasses('insert', [{
                    classcode: 'HOLD',
                    descrip: 'Placeholder Class',
                    indexcode: '',
                    caridxrestrict: '',
                    classmultiplier: 1.0,
                    usecarflag: false,
                    carindexed: false,
                    eventtrophy: false,
                    champtrophy: false,
                    secondruns: false,
                    countedruns: 0
                }])
            }

            if (options.accounts) {
                await tx.none('insert into $1:name.paymentaccounts (select * from $2:name.paymentaccounts)', [series, current])
                await tx.none('insert into $1:name.paymentitems    (select * from $2:name.paymentitems)',    [series, current])
                await tx.none('insert into $1:name.paymentsecrets  (select * from $2:name.paymentsecrets)',  [series, current])
            }

            return {}
        })
    }

    async activity() {
        const store: {[key: string] : ActivityEntry} = {}
        const sql = (table) => 'SELECT distinct(d.driverid), d.firstname, d.lastname, d.email, d.optoutmail, d.barcode, r.eventid, c.classcode ' +
                               `FROM ${table} r JOIN cars c ON r.carid=c.carid JOIN drivers d ON c.driverid=d.driverid`

        const regs = await this.db.any(sql('runs'))
        for (const r of regs) {
            const e = getD(store, r.driverid, () => Object.assign(r, { reg: {}, runs: {}}) as ActivityEntry)
            getD(e.runs, r.eventid, () => []).push(r.classcode)
        }
        const runs = await this.db.any(sql('registered'))
        for (const r of runs) {
            const e = getD(store, r.driverid, () => Object.assign(r, { reg: {}, runs: {}}) as ActivityEntry)
            getD(e.reg, r.eventid, () => []).push(r.classcode)
        }

        const rows = await this.db.any("SELECT driverid FROM unsubscribe WHERE emaillistid=(SELECT val FROM settings WHERE name='emaillistid')")
        const ids = new Set(rows.map(r => r.driverid as UUID))

        const ret = Object.values(store)
        for (const e of ret) {
            if (e.optoutmail || ids.has(e.driverid)) {
                e.email = '********'
            }
        }

        return ret
    }
}
