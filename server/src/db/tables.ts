import { IMain } from 'pg-promise'
import { v1 as uuidv1 } from 'uuid'
import { cleanAttr } from './helper'

const created  = { name: 'created',  cast: 'timestamp',              init: (col: any): any => { return col.exists ? col.value : 'now()' } }
const modified = { name: 'modified', cast: 'timestamp', mod: ':raw', init: (): any         => { return 'now()' } }
const attr     = { name: 'attr',     cast: 'json',                   init: (col: any): any => { return cleanAttr(col.value) } }

export function createColumnSets(pgp: IMain) {
    return {
        drivers: new pgp.helpers.ColumnSet([
            { name: 'driverid', cnd: true, cast: 'uuid' },
            'firstname', 'lastname', 'email', 'username',
            { name: 'barcode', def: '' },
            { name: 'optoutmail', def: false },
            attr, created, modified
        ], { table: 'drivers' }),


        weekendmembers: new pgp.helpers.ColumnSet([
            { name: 'uniqueid', cnd: true, cast: 'uuid' },
            { name: 'driverid', cast: 'uuid' },
            'membership', 'startdate', 'enddate', 'issuer', 'issuermem', 'region', 'area', modified
        ], { table: 'weekendmembers' }),


        settings: new pgp.helpers.ColumnSet([
            { name: 'name', cnd: true },
            'val', modified
        ], { table: 'settings' }),


        cars: new pgp.helpers.ColumnSet([
            { name: 'carid', cnd: true, cast: 'uuid' },
            { name: 'driverid', cast: 'uuid' },
            'classcode', 'indexcode', 'number:value',
            { name: 'useclsmult', def: false },
            attr, created, modified
        ], { table: 'cars' }),


        events: new pgp.helpers.ColumnSet([
            { name: 'eventid', cnd: true, cast: 'uuid', init: (col: any): any => { return col.exists ? col.value : uuidv1() } },
            { name: 'date', cast: 'date' },
            { name: 'regopened', cast: 'timestamp' },
            { name: 'regclosed', cast: 'timestamp' },
            'name', 'champrequire', 'useastiebreak', 'isexternal', 'ispro', 'ispractice',
            { name: 'regtype', cast: 'int' },
            { name: 'courses', cast: 'int' },
            { name: 'runs', cast: 'int' },
            { name: 'countedruns', cast: 'int' },
            { name: 'segments', cast: 'int' },
            { name: 'perlimit', cast: 'int' },
            { name: 'totlimit', cast: 'int' },
            { name: 'sinlimit', cast: 'int' },
            'conepen', 'gatepen', 'accountid', attr, created, modified
        ], { table: 'events' }),

        classlist: new pgp.helpers.ColumnSet([
            { name: 'classcode', cnd: true },
            { name: 'descrip' },
            'indexcode', 'caridxrestrict', 'classmultiplier', 'usecarflag',
            'carindexed', 'eventtrophy', 'champtrophy', 'secondruns', 'countedruns', modified
        ], { table: 'classlist' }),

        indexlist: new pgp.helpers.ColumnSet([
            { name: 'indexcode', cnd: true },
            { name: 'descrip' },
            { name: 'value',    init: (col) => { return Number(col.value) } }, // init better than :raw for security even with checks below
            modified
        ], { table: 'indexlist' }),

        registered: new pgp.helpers.ColumnSet([
            { name: 'eventid', cnd: true, cast: 'uuid' },
            { name: 'carid',   cnd: true, cast: 'uuid' },
            { name: 'session', cnd: true, def: '' },
            { name: 'rorder',  def: 0 },
            modified
        ], { table: 'registered' }),

        payments: new pgp.helpers.ColumnSet([
            { name: 'payid',    cnd: true, cast: 'uuid' },
            { name: 'eventid',  cast: 'uuid' },
            { name: 'driverid', cast: 'uuid' },
            { name: 'carid',    cast: 'uuid', def: null },
            { name: 'session',  def: null },
            { name: 'txtype' },
            { name: 'txid' },
            { name: 'txtime',   cast: 'timestamp' },
            { name: 'amount' },
            { name: 'refunded' },
            { name: 'itemname' },
            { name: 'accountid' },
            modified
        ], { table: 'payments' }),

        paymentaccounts: new pgp.helpers.ColumnSet([
            { name: 'accountid', cnd: true },
            { name: 'name' },
            { name: 'type' },
            attr, modified
        ], { table: 'paymentaccounts' }),

        paymentsecrets: new pgp.helpers.ColumnSet([
            { name: 'accountid', cnd: true },
            { name: 'secret' },
            attr, modified
        ], { table: 'paymentsecrets' }),

        paymentitems: new pgp.helpers.ColumnSet([
            { name: 'itemid', cnd: true },
            { name: 'name' },
            { name: 'itemtype' },
            { name: 'price' },
            { name: 'currency' },
            modified
        ], { table: 'paymentitems' }),

        itemeventmap: new pgp.helpers.ColumnSet([
            { name: 'eventid', cnd: true, cast: 'uuid' },
            { name: 'itemid',  cnd: true },
            { name: 'maxcount', cast: 'int' },
            { name: 'required', cast: 'bool' },
            modified
        ], { table: 'itemeventmap' }),

        runs: new pgp.helpers.ColumnSet([
            { name: 'eventid',  cnd: true, cast: 'uuid' },
            { name: 'carid',    cnd: true, cast: 'uuid' },
            { name: 'rungroup', cnd: true },
            { name: 'course',   cnd: true },
            { name: 'run',      cnd: true },
            'raw', 'cones', 'gates', 'status', attr, modified
        ], { table: 'runs' }),

        timertimes: new pgp.helpers.ColumnSet([
            { name: 'timeid', cnd: true, cast: 'uuid' },
            'course', 'raw', 'status', attr, modified
        ], { table: 'timertimes' }),

        challenges: new pgp.helpers.ColumnSet([
            { name: 'challengeid', cnd: true, cast: 'uuid' },
            { name: 'eventid', cast: 'uuid' },
            { name: 'name' },
            { name: 'depth' },
            modified
        ], { table: 'challenges' }),

        challengerounds: new pgp.helpers.ColumnSet([
            { name: 'challengeid', cnd: true, cast: 'uuid' },
            { name: 'round', cnd: true },
            'swappedstart', 'carid1', 'car1dial', 'car2id', 'car2dial', modified
        ], { table: 'challengerounds' }),

        challengeruns: new pgp.helpers.ColumnSet([
            { name: 'challengeid', cnd: true, cast: 'uuid' },
            { name: 'round', cnd: true },
            { name: 'carid', cnd: true, cast: 'uuid' },
            { name: 'course', cnd: true },
            'reaction', 'sixty', 'raw', 'cones', 'gates', 'status', modified
        ], { table: 'challengeruns' }),

        challengestaging: new pgp.helpers.ColumnSet([
            { name: 'challengeid', cnd: true, cast: 'uuid' },
            { name: 'stageinfo', cast: 'json' },
            modified
        ], { table: 'challengestaging' }),

        externalresults: new pgp.helpers.ColumnSet([
            { name: 'eventid',   cnd: true, cast: 'uuid' },
            { name: 'classcode', cnd: true },
            { name: 'driverid',  cnd: true, cast: 'uuid' },
            'net', modified
        ], { table: 'eventresults' }),


        runorder: new pgp.helpers.ColumnSet([
            { name: 'eventid',  cnd: true, cast: 'uuid' },
            { name: 'course',   cnd: true },
            { name: 'rungroup', cnd: true },
            { name: 'cars', cast: 'uuid[]' },
            modified
        ], { table: 'runorder' }),


        classorder: new pgp.helpers.ColumnSet([
            { name: 'eventid',  cnd: true, cast: 'uuid' },
            { name: 'rungroup', cnd: true },
            { name: 'classes', cast: 'text[]' },
            modified
        ], { table: 'classorder' }),


        // above is all the tracked and synced tables, below are non-tracked tables

        unsubscribe: new pgp.helpers.ColumnSet([
            'emaillistid',
            { name: 'driverid', cast: 'uuid' }
        ], { table: 'unsubscribe' }),

        mergeservers: new pgp.helpers.ColumnSet([
            { name: 'serverid', cnd: true, cast: 'uuid' },
            'hostname', 'address', 'waittime', 'ctimeout', 'cfailures', 'hoststate', 'quickruns',
            { name: 'lastcheck', cast: 'timestamp', mod: ':raw' },
            { name: 'nextcheck', cast: 'timestamp', mod: ':raw' },
            { name: 'mergestate', cast: 'json' }
        ], { table: 'mergeservers' })
    }
}
