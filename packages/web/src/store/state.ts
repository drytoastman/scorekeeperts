import { Driver } from 'sctypes/driver'
import { PaymentAccount, PaymentItem } from 'sctypes/payments'
import { SeriesClass, SeriesIndex } from 'sctypes/classindex'
import { ItemMap, SeriesEvent } from 'sctypes/event'
import { Car } from 'sctypes/car'
import { Registration, Payment } from 'sctypes/register'
import { UUID } from 'sctypes/util'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { LiveSocketWatch } from 'sctypes/results'

export const EMPTY = ''
export const API2 = {
    ROOT:           '/api2',
    SERIESADMIN:    '/api2/seriesadmin',
    LOGIN:          '/api2/login',
    TOKEN:          '/api2/token',
    LIVE:           '/api2/live',
    UPDATES:        '/api2/updates',
    LOGOUT:         '/api2/logout',
    REGISTER:       '/api2/register',
    RESET:          '/api2/reset',
    CHANGEPASSWORD: '/api2/changepassword',
    ADMINLOGIN:     '/api2/adminlogin',
    SERIESLOGIN:    '/api2/serieslogin',
    ADMINLOGOUT:    '/api2/adminlogout',
    LOGS:           '/api2/logs',
    CARDS:          '/api2/cards',
    ICAL:           '/api2/ical/DRIVERID'
}


export class Api2State {
    constructor(authtype: string) {
        this.auth.type = authtype
    }

    errors: string[] = []
    infos: string[] = []
    serieslist: string[] = []
    listids: string[] = []
    paxlists: string[] = []
    websocket: ReconnectingWebSocket | undefined = undefined
    authinitial = false // true once we get our first authinfo back

    // auth
    auth = {
        driver: false, // driver authenticated
        admin:  false, // admin authenticated
        series: {},    // which series have been authenticated
        type:   ''     // what type of authtype to send in requests (driver, series, admin)
    }

    // non series specific
    ismainserver = false
    drivers: {[key: string]: Driver} = {}
    driverid = ''
    unsubscribe: string[] = []
    summary: any[] = []
    emailresult: any = {}
    tokenresult = ''
    carts: {[key: string]: {[key: string]: {[key: string]: any }}} = {}

    // series specific
    currentSeries = EMPTY
    settings: {[key: string]: any} = {}
    paymentaccounts: {[key: string]: PaymentAccount} = {}
    paymentitems: {[key: string]: PaymentItem} = {}
    itemeventmap: {[key: string]: ItemMap[]} = {}
    classes: {[key: string]: SeriesClass} = {}
    indexes: {[key: string]: SeriesIndex} = {}
    events: {[key: string]: SeriesEvent} = {}
    cars: {[key: string]: Car} = {}
    registered: {[key: string]: Registration[]} = {}
    payments: {[key: string]: Payment[]} = {}
    attendance: {[key: string]: UUID[]} = {}
    dattendance: {[key: string]: {[key: string]: string[]}} = {}
    counts: {[key: string]: any} = {}
    classorder: {[key: string]: any} = {}
    driversattr: {[key: string]: any} = {}

    // square oauth
    squareapplicationid = ''
    squareoauthresp = {}

    // results
    allseries: string[] = []
    seriesinfo: any = {}
    eventresults: any = {}
    champresults: any = {}
    live = {
        eventid: '',
        eventslug: '',
        getclass: '',
        watch: undefined as LiveSocketWatch|undefined,

        prev: {},
        last: {},
        next: {},
        left: {},
        leftorder: {},
        lefttimer: [],
        right: {},
        rightorder: {},
        righttimer: [],

        lastclass: { nodata: 'no data' } as  any|undefined,
        topnet: {},
        topraw: {},
        runorder: {},
        timer: 0
    }

    // other more temporary things
    gettingData = 0
    busyDriver: {[key: string]: boolean} = {} // driverid set
    busyCars:   {[key: string]: boolean} = {} // carid set
    busyReg:    {[key: string]: boolean} = {} // eventid set
    busyPay:    {[key: string]: boolean} = {} // eventid set
    busyClass:  {[key: string]: boolean} = {} // classcode set
    busyIndex:  {[key: string]: boolean} = {} // indexcode set
    busyPayment: {[key: string]: boolean} = {} // txid set
    itemsPerPage = 20

    // opaque things that we don't track
    panelstate = [] // we set/get at will, saves state across page movement
    flashProfile = false
    flashCars = false
    flashEvents = false
}
