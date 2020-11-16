import orderBy from 'lodash/orderBy'
import cloneDeep from 'lodash/cloneDeep'

import { EventResults, TopTimeEntry, TopTimesKey, TopTimesTable } from '@/common/results'
import { decorateEntrant } from '@/common/decorate'
import { ClassData } from '@/common/classindex'
import { UUID } from '@/common/util'

export function createTopTimesTable(classdata: ClassData, results: EventResults, keys: TopTimesKey[], carid?: UUID): TopTimesTable {
    /*
        Generate lists on demand as there are many iterations.  Returns a TopTimesTable class
        that wraps all the TopTimesLists together.
        For each key passed in, the following values may be set:
            indexed = True for indexed times, False for penalized but raw times
            counted = True for to only included 'counted' runs and non-second run classes
            course  = 0 for combined course total, >0 for specific course
            Extra fields that have standard defaults we stick with:
            title   = A string to override the list title with
            col     = A list of column names for the table
            fields  = The fields to match to each column
    */
    const ret: TopTimesTable = {
        titles: [],
        colcount: [],
        cols: [],
        fields: [],
        rows: []
    }

    function addList(title: string, cols: string[], fields: string[], entries: TopTimeEntry[]) {
        ret.titles.push(title)
        ret.colcount.push(cols.length)
        ret.cols.push(cols)
        ret.fields.push(fields)
        while (ret.rows.length < entries.length) {
            ret.rows.push([])
        }
        entries.forEach((entry, index) => {
            ret.rows[index].push(entry)
        })
    }

    for (const key of keys) {
        // Create the list base
        let title  = key.title
        let cols   = key.cols
        let fields = key.fields
        if (!title) {
            title  = `Top ${key.indexed ? 'Indexed ' : ''}Times (${key.counted ? 'Counted' : 'All'} Runs)`
            if (key.course > 0) title += ` Course ${key.course}`
        }
        if (!cols || !cols.length)     {   cols = ['#',   'Name', 'Class',     'Index',    '',         'Time'] }
        if (!fields || !fields.length) { fields = ['pos', 'name', 'classcode', 'indexstr', 'indexval', 'time'] }
        if (cols.length !== fields.length) {
            throw Error(`Top times columns and field arrays are not equal in size (${cols.length}, ${fields.length})`)
        }

        let entries: TopTimeEntry[] = []
        for (const classcode in results) {
            if (classcode === '_eventid') continue
            if (classdata.classlist[classcode].secondruns && key.counted) { continue }

            for (const e of results[classcode]) {
                let current = false
                const base = {
                    name:      `${e.firstname} ${e.lastname}`,
                    classcode: e.classcode,
                    indexstr:  e.indexstr,
                    indexval:  e.indexval,
                    time:      0,
                    current:   false,
                    pos:       null,
                    ispotential: false,
                    isold:       false
                }

                // For the selected car, highlight and throw in any old/potential results if available
                if (carid && e.carid === carid) {
                    current = true
                    const ecopy = cloneDeep(e)  // Make a copy so decorations stay relative to this data
                    decorateEntrant(ecopy)
                    if (key.course === 0) { // don't do old/potential single course stuff at this point
                        const divisor = key.indexed ? 1.0 : ecopy.indexval

                        if (ecopy.potnet) {
                            entries.push(Object.assign({}, base, { time: ecopy.potnet / divisor, ispotential: true }))
                        }
                        if (ecopy.oldnet) {
                            entries.push(Object.assign({}, base, { time: ecopy.oldnet / divisor, isold: true }))
                        }
                    }
                }

                // Extract appropriate time for this entrant
                let time = 999.999
                if (key.course > 0) {
                    for (const r of e.runs[key.course - 1]) {
                        if ((key.counted && r.norder === 1) || (!key.counted && r.anorder === 1)) {
                            time = key.indexed ? r.net : r.pen
                        }
                    }
                } else {
                    if (key.counted) {
                        time = key.indexed ? e.net : e.pen
                    } else {
                        time = key.indexed ? e.netall : e.penall
                    }
                }

                entries.push(Object.assign({}, base, { time: time, current: current, pos: -1 }))
            }
        }

        // Sort and set 'pos' attribute, then add to the mass table
        entries = orderBy(entries, 'time')
        let pos = 1
        for (const entry of entries) {
            if (entry.classcode) {
                entry.pos = pos
                pos += 1
            }
        }

        addList(title, cols, fields, entries)
    }

    return ret
}
