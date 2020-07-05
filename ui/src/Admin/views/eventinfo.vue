<template>
    <div class='outer'>
        <h2>{{event.name}} {{fmtdate}}</h2>
        <div><router-link :to="{name: 'epayments'}">Payments</router-link></div>
        <v-btn @click='dopdf'>Generate Cards</v-btn>
        <EventSettings :event="event"></EventSettings>
    </div>
</template>

<script>
import _ from 'lodash'
import axios from 'axios'
import Vue from 'vue'
import { format } from 'date-fns'
import { mapState } from 'vuex'
import EventSettings from '../components/EventSettings.vue'
import Handlebars from 'handlebars'
import JsBarcode from 'jsbarcode'
import txt from './template.txt'


export default {
    name: 'EventInfo',
    components: {
        EventSettings
    },
    props: {
        eventid: String
    },
    computed: {
        ...mapState(['events', 'drivers', 'cars', 'registered']),
        event() { return this.events[this.eventid] },
        fmtdate() { return format(new Date(this.event.date), 'EEE MMM dd Y') }
    },
    methods: {
        async dopdf() {
                        /*
            const d = new DOMParser()
            await Vue.loadScript('https://github.com/niklasvh/html2canvas/releases/download/v1.0.0-rc.5/html2canvas.min.js')
            await Vue.loadScript('https://unpkg.com/jspdf@latest/dist/jspdf.min.js')
            const h = await axios.get('http://127.0.0.1:80/admin/nwr2020/event/76e37fc2-5a09-11ea-8800-0242ac120005/cards?type=lastname&page=template')

            // console.log(h.data)
            // eslint-disable-next-line no-undef
            window.html2canvas = html2canvas
            const dom = d.parseFromString(h.data, 'text/html')
            // debugger
            // eslint-disable-next-line new-cap,no-undef
            const doc = new jsPDF('p', 'pt', 'letter')
            doc.html(dom.body).save('cards.pdf')


            const pdfMake = (await import(/* webpackChunkName: "cardcreation" * '../cardcreation/pdfmake.js')).default
            if (pdfMake.vfs === undefined) {
                const pdfFonts = await import(/* webpackChunkName: "cardcreation" * '../cardcreation/vfs_fonts.js')
                pdfMake.vfs = pdfFonts.pdfMake.vfs
            }

            pdfMake.tableLayouts = {
                exampleLayout: {
                    hLineWidth: function(i, node) {
                        return 0.1
                    },
                    vLineWidth: function(i) {
                        return 0.1
                    },
                    hLineColor: function(i) {
                        return '#000'
                    },
                    paddingLeft: function(i) {
                        return 2
                    },
                    paddingRight: function(i, node) {
                        return 0
                    }
                }
            }

            this.$store.dispatch('ensureCarDriverInfo', this.registered[this.event.eventid].map(r => r.carid)).then(() => {
                const template = Handlebars.compile(txt)
                Handlebars.registerHelper('mdy', function(s) { return format(new Date(s), 'MMM dd Y') })

                try {
                    const cards = []
                    const reg = this.registered[this.event.eventid]
                    for (const r of reg) {
                        const barcode = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
                        JsBarcode(barcode, 'Hello', { height: 22, width: 1, text: 'quick', fontSize: 11, textMargin: 0, margin: 2 })
                        // Need to leave HTML characters but escape double quotes as its in JSON
                        const barcodetext = new Handlebars.SafeString(barcode.outerHTML.replaceAll('"', '\\"'))
                        const car = this.cars[r.carid]
                        const s = template({
                            driver: this.drivers[car.driverid],
                            car: car,
                            event: this.event,
                            barcode: barcodetext
                        })

                        // And back to regular JS objects/arrays
                        cards.push(...JSON.parse(s))
                    }

                    const docDefinition = {
                        pageSize: { width: 8 * 72, height: 5 * 72 },
                        pageMargins: [20, 20, 20, 20],
                        pageOrientation: 'landscape',
                        content: cards
                    }
                    pdfMake.createPdf(docDefinition).open()  // .download('cards.pdf')
                } catch (error) {
                    console.error(error)
                    alert(error)
                }
            })
            */
        }
    },
    async mounted() {
        const req = []
        if (_.isEmpty(this.$store.state.payments)) {
            req.push(this.$store.dispatch('getdata', { items: 'payments' }))
        }
        if (_.isEmpty(this.$store.state.registered)) {
            req.push(this.$store.dispatch('getdata', { items: 'registered' }))
        }
        await Promise.all(req)
    }
}
</script>

<style scoped>
.outer {
    margin: 1rem;
}
</style>
