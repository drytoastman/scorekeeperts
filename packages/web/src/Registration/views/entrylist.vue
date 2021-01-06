<template>
    <div v-if='error'>
        {{error}}
    </div>
    <div v-else-if='total > 0'>
        <div class='name'>{{event.name}}</div>
        <div class='date'>{{event.date|dmdy}}</div>
        <div class='count'>
            <span><b>Total:</b> {{total}}</span>
            <span><b>Unique:</b> {{unique}}</span>
            <span><b>Paid:</b> {{paid}}</span>
        </div>
        <table :class="event.attr.paymentreq ? 'paymentreq' : ''">
            <template v-for="classcode in classes">
                <tr :key="classcode">
                    <th colspan=3>
                        <div>
                            {{classcode}}
                        </div>
                        <div>
                            <span v-if="event.attr.paymentreq">
                                {{entryData[classcode].filter(e => !e.css).length}} paid /
                            </span>
                            {{entryData[classcode].length}} entries
                        </div>
                    </th>
                </tr>
                <tr v-for="e in entryData[classcode]" :key="classcode+e.carid" :class="e.css">
                    <td>{{e.firstname}} {{e.lastname}}</td>
                    <td>{{e.indexcode}}
                    <td>{{e.year}} {{e.make}} {{e.model}} {{e.color}}</td>
                </tr>
            </template>
        </table>
    </div>
    <div v-else>
        loading...
    </div>
</template>

<script>
import orderBy from 'lodash/orderBy'

export default {
    name: 'EntryList',
    props: {
        eventslug: String
    },
    data: () => ({
        entryData: {},
        error: '',
        total: -1,
        unique: -1,
        paid: -1
    }),
    computed: {
        event() {
            return this.$store.getters.eventInfo(this.eventslug)
        },
        classes() {
            return orderBy(Object.keys(this.entryData))
        }
    },
    mounted() {
        this.$store.dispatch('getdata', { items: 'entrylist', eventid: this.eventslug }).then(data => {
            if (data) {
                const ret = {}
                const seen = new Set()
                for (const e of data.entrylist) {
                    if (!(e.classcode in ret)) {
                        ret[e.classcode] = []
                    }
                    e.css = ''
                    ret[e.classcode].push(e)
                    this.total += 1
                    if (!seen.has(e.driverid)) {
                        seen.add(e.driverid)
                        this.unique += 1
                    }
                    if (e.payments > 0) {
                        this.paid += 1
                    } else {
                        e.css += 'notpaid'
                    }
                }
                this.entryData = ret
            } else {
                this.error = 'error getting entrylist'
            }
        })
    }
}
</script>

<style scoped lang="scss">
.name, .date, .count {
    text-align: center;
}
.name {
    font-size: 150%;
}
.date {
    font-size: 120%;
}
.count {
    span {
        margin-right: 0.5rem;
    }
}

table {
    border-collapse: collapse;
    margin: 1rem auto 0 auto;
}
th, td {
    border: 1px solid #CCC;
    padding: 1px 8px;
    font-weight: normal;
}
th {
    text-align: left;
    background: var(--v-secondary-base);
    color: white;
    div {
        display: inline-block;
    }
    div + div {
        float: right;
    }
}
.paymentreq .notpaid {
    color: rgb(0,0,0,0.2);
}
</style>
