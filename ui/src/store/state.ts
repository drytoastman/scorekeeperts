import { PaymentAccount, SeriesClass, SeriesIndex, SeriesEvent, Car, Registration, Payment, Driver } from '@common/lib'
import ReconnectingWebSocket from 'reconnecting-websocket'

export const EMPTY = ''
export const API2ROOT = '/api2'

export class Api2State {
    errors: string[] = []
    serieslist: string[] = []
    listids: string[] = []

    // singular driver specific
    driver: Driver = {} as Driver
    unsubscribe: string[] = []
    summary: any[] = []
    emailresult: any = {}
    usednumbers: number[] = []

    // auth pieces
    driverAuthenticated = true  // assume we are and then fallback if our API requests fail

    // series specific
    currentSeries = EMPTY
    paymentaccounts: {[key: string]: PaymentAccount} = {}
    paymentitems: PaymentItem[] = []
    classes: {[key: string]: SeriesClass} = {}
    indexes: {[key: string]: SeriesIndex} = {}
    events: {[key: string]: SeriesEvent} = {}
    cars: {[key: string]: Car} = {}
    registered: {[key: string]: Registration[]} = {}
    payments: {[key: string]: { [key: string]: Payment[]}} = {}
    counts: {[key: string]: any} = {}

    // other more temporary things
    gettingData = false
    busyDriver: {[key: string]: boolean} = {} // driverid set
    busyCars: {[key: string]: boolean} = {} // carid set
    busyReg:  {[key: string]: boolean} = {} // eventid set
    busyPay:  {[key: string]: boolean} = {} // eventid set

    ws: ReconnectingWebSocket = new ReconnectingWebSocket(`ws://${window.location.host}${API2ROOT}/live`, undefined, {
        minReconnectionDelay: 1000,
        maxRetries: 10,
        startClosed: true
    })

    // opaque things
    panelstate = [] // we set/get at will, saves state across page movement
}
