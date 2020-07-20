<template>
    <div class='outer'>
        <h2>Used Number List</h2>
        <span class="error" v-if="browserWarn">This browser {{browserWarn}} may not print columns correctly</span>
        <ul class='classes'>
            <li v-for="(subobj, code) in usedNumbers" :key="code">
                <span class='code'>{{code}}</span>
                <ul class='entries'>
                    <li v-for="(names, num) in subobj" :key="code+num">
                        <b>{{num}}</b>: {{names}}
                    </li>
                </ul>
            </li>
        </ul>
    </div>
</template>

<script>
import { mapState } from 'vuex'
export default {
    name: 'UsedNumbers',
    computed: {
        ...mapState(['settings', 'drivers', 'cars']),
        usedNumbers() {
            const ret = {}
            for (const car of Object.values(this.cars)) {
                if (car.classcode === 'HOLD') continue
                const code = this.settings.superuniquenumbers ? 'All' : car.classcode
                if (!(code in ret)) ret[code] = {}
                if (!(car.number in ret[code])) ret[code][car.number] = {}
                ret[code][car.number][car.driverid] = 1
            }
            for (const code in ret) {
                for (const num in ret[code]) {
                    ret[code][num] = Object.keys(ret[code][num]).map(did => {
                        const driver = this.drivers[did]
                        if (driver) return `${driver.firstname} ${driver.lastname}`
                        return ''
                    }).join(', ')
                }
            }
            return ret
        },
        browserWarn() {
            const a = window.navigator.userAgent.split(' ').pop()
            return a.includes('Safari') ? a : false
        }
    },
    async mounted() {
        await this.$store.dispatch('getdata', { items: 'cars' })
        this.$store.dispatch('ensureCarDriverInfo', Object.values(this.cars).map(c => c.carid))
    }
}
</script>

<style scoped>
.outer {
    margin: 1rem;
}
ul.classes {
    list-style: none;
    padding: 0;
}
ul.classes > li {
    page-break-inside: avoid;
}
span.code {
    font-weight: bold;
}
ul.entries {
    list-style: none;
    column-count: 3;
    padding: 0 0 0.3rem 0;
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
}
b {
    text-align: right;
    display: inline-block;
    width: 2.1rem;
}
@media print {
    h2 { display: none; }
}
</style>
