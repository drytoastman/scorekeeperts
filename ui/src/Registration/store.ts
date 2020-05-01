import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'
import { Driver, SeriesEvent, Car, Registration, Payment, SeriesIndex, SeriesClass } from '@common/lib'

function root () {
    return '/api/register'
}

function errorhandler (mod: VuexModule<any>, error: any) {
    if (error.response) {
        if (error.response.status === 401) {
            mod.context.commit('authenticate', false)
        }
        if (typeof error.response.data === 'object') {
            mod.context.commit('setErrors', error.response.data.result || error.response.data.error)
        } else {
            mod.context.commit('setErrors', [error.response.data])
        }
    } else {
        mod.context.commit('setErrors', [error.toString().replace('Error: ', '')])
    }
}

function clearSeriesData (state: any) {
    state.classes = []
    state.indexes = []
    state.events = {}
    state.cars = {}
    state.registered = {}
    state.payments = {}
    state.counts = {}
}

@Module({ namespaced: true })
class RegisterModule extends VuexModule {
    authenticated: string|boolean = ''
    errors: string[] = []
    series = ''
    driver: Driver = {} as Driver
    classes: {[key: string]: SeriesClass} = {}
    indexes: {[key: string]: SeriesIndex} = {}
    events: {[key: string]: SeriesEvent} = {}
    cars: {[key: string]: Car} = {}
    registered: {[key: string]: Registration[]} = {}
    payments: {[key: string]: Payment[]} = {}
    counts: {[key: string]: any} = {}
    emailresult: any = {}
    usednumbers: number[] = []

    @Mutation
    authenticate (ok: boolean) {
        this.authenticated = ok
        if (!ok) {
            this.driver = {} as Driver
            clearSeriesData(this)
        } else {
            this.errors = []
        }
    }

    @Mutation
    setErrors (errors: string[]) {
        this.errors = errors
    }

    @Mutation
    setEmailResult (data: any[]) {
        this.emailresult = data
    }

    @Mutation
    setUsedNumbers (data: number[]) {
        this.usednumbers = data
    }

    @Mutation
    apiData (data: any) {
        if (data === undefined) return

        if ('driver' in data) {
            this.driver = data.driver
        }

        if (('series' in data) && (data.series !== this.series)) {
            clearSeriesData(this)
            this.series = data.series
        }

        if ('classes' in data) {
            this.classes = data.classes
        }

        if ('indexes' in data) {
            this.indexes = data.indexes
        }

        if ('events' in data) {
            if (data.type === 'get') {
                this.events = {}
            }
            data.events.forEach((e: SeriesEvent) => Vue.set(this.events, e.eventid, e))
        }

        if ('cars' in data) {
            if (data.type === 'delete') {
                data.cars.forEach((c: Car) => Vue.delete(this.cars, c.carid))
            } else { // get or update
                if (data.type === 'get') { this.cars = {} }
                data.cars.forEach((c: Car) => Vue.set(this.cars, c.carid, c))
            }
        }

        if ('registered' in data) {
            this.registered = {}
            data.registered.forEach((r: Registration) => {
                if (!(r.eventid in this.registered)) { Vue.set(this.registered, r.eventid, []) }
                this.registered[r.eventid].push(r)
            })
        }

        if ('payments' in data) {
            this.payments = {}
            data.payments.forEach((p: Payment) => {
                if (!(p.eventid in this.payments)) { Vue.set(this.payments, p.eventid, []) }
                this.payments[p.eventid].push(p)
            })
        }

        if ('counts' in data) {
            this.counts = {}
            data.counts.forEach((e: SeriesEvent) => Vue.set(this.counts, e.eventid, e))
        }
    }

    @Action({ rawError: true })
    async getdata (p: any) {
        try {
            const data = (await axios.get(root() + '/api', { params: p, withCredentials: true })).data
            this.context.commit('authenticate', true) // we must be auth if this happens
            this.context.commit('apiData', data)
        } catch (error) {
            errorhandler(this, error)
        }
    }

    @Action({ rawError: true })
    async setdata (p: any) {
        try {
            const data = (await axios.post(root() + '/api', p, { withCredentials: true })).data
            this.context.commit('authenticate', true) // we must be auth if this happens
            this.context.commit('apiData', data)
        } catch (error) {
            errorhandler(this, error)
        }
    }

    @Action({ rawError: true })
    async getUsedNumbers (p: any) {
        try {
            const data = (await axios.get(root() + '/used', { params: p, withCredentials: true })).data
            this.context.commit('setUsedNumbers', data)
        } catch (error) {
            errorhandler(this, error)
        }
    }

    @Action({ rawError: true })
    async login (p: any) {
        try {
            await axios.post(root() + '/debuglogin', p, { withCredentials: true })
            this.context.commit('authenticate', true)
        } catch (error) {
            errorhandler(this, error)
        }
    }

    @Action
    async logout () {
        try {
            await axios.get(root() + '/logout', { withCredentials: true })
            this.context.commit('authenticate', false)
        } catch (error) {
            errorhandler(this, error)
        }
    }

    @Action({ rawError: true })
    async regreset (p: any) {
        try {
            const resp = (await axios.post(root() + '/regreset', p, { withCredentials: true })).data
            this.context.commit('setEmailResult', resp.data)
        } catch (error) {
            errorhandler(this, error)
        }
    }
}

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
    },
    mutations: {
    },
    actions: {
    },
    modules: {
        register: RegisterModule
    }
})
