import ReconnectingWebSocket from 'reconnecting-websocket'
import { Driver } from '@/common/driver'
import { PaymentAccount } from '@/common/payments'
import { SeriesClass, SeriesIndex } from '@/common/classindex'
import { SeriesEvent } from '@/common/event'
import { Car } from '@/common/car'
import { Registration, Payment } from '@/common/register'
import { UUID } from '../common/util'

export const EMPTY = ''
export const API2 = {
    ROOT:  '/api2',
    LOGIN: '/api2/login',
    TOKEN: '/api2/token',
    LIVE:  '/api2/live',
    LOGOUT: '/api2/logout',
    REGISTER: '/api2/register',
    RESET:    '/api2/reset',
    CHANGEPASSWORD: '/api2/changepassword',
    ADMINLOGIN: '/api2/adminlogin',
    SERIESLOGIN: '/api2/serieslogin',
    ADMINLOGOUT: '/api2/adminlogout',
    LOGS: '/api2/logs',
    CARDS: '/api2/cards'
}

export class Api2State {
    errors: string[] = []
    serieslist: string[] = []
    listids: string[] = []

    // non series specific
    drivers: {[key: string]: Driver} = {}
    driverid = ''
    unsubscribe: string[] = []
    summary: any[] = []
    emailresult: any = {}
    tokenresult = ''

    // auth pieces, we always assume we are and then fallback if our API requests fail
    driverAuthenticated = true
    seriesAuthenticated = {}
    adminAuthenticated = true

    // series specific
    currentSeries = EMPTY
    settings: {[key: string]: any} = {}
    paymentaccounts: {[key: string]: PaymentAccount} = {}
    paymentitems: {[key: string]: PaymentItem} = {}
    classes: {[key: string]: SeriesClass} = {}
    indexes: {[key: string]: SeriesIndex} = {}
    events: {[key: string]: SeriesEvent} = {}
    cars: {[key: string]: Car} = {}
    registered: {[key: string]: Registration[]} = {}
    payments: {[key: string]: Payment[]} = {}
    attendance: {[key: string]: UUID[]} = {}
    counts: {[key: string]: any} = {}

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

    // used for communications
    authtype= ''
    ws: ReconnectingWebSocket = new ReconnectingWebSocket(`ws://${window.location.host}${API2.LIVE}`, undefined, {
        minReconnectionDelay: 1000,
        maxRetries: 10,
        startClosed: true
    })

    // opaque things that we don't track
    panelstate = [] // we set/get at will, saves state across page movement
}
