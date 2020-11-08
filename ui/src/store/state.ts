import { Driver } from '@/common/driver'
import { PaymentAccount, PaymentItem } from '@/common/payments'
import { SeriesClass, SeriesIndex } from '@/common/classindex'
import { ItemMap, SeriesEvent } from '@/common/event'
import { Car } from '@/common/car'
import { Registration, Payment } from '@/common/register'
import { UUID } from '../common/util'
import ReconnectingWebSocket from 'reconnecting-websocket'

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
    CARDS:          '/api2/cards'
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
    counts: {[key: string]: any} = {}
    classorder: {[key: string]: any} = {}
    driversattr: {[key: string]: any} = {}

    // square oauth
    squareapplicationid = ''
    squareoauthresp = {}

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
