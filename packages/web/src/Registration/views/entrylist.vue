<template>
    <div v-if='error'>
        {{error}}
    </div>
    <div v-else>
        <table>
            <template v-for="classcode in classes">
                <tr :key="classcode">
                    <th colspan=3>
                        {{classcode}} - {{entryData[classcode].length}} entries
                    </th>
                </tr>
                <tr v-for="e in entryData[classcode]" :key="classcode+e.carid">
                    <td>{{e.firstname}} {{e.lastname}}</td>
                    <td>{{e.indexcode}}
                    <td>{{e.year}} {{e.make}} {{e.model}} {{e.color}}</td>
                </tr>
            </template>
        </table>
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
        error: ''
    }),
    computed: {
        classes() {
            return orderBy(Object.keys(this.entryData))
        }
    },
    mounted() {
        this.$store.dispatch('getdata', { items: 'entrylist', eventid: this.eventslug }).then(data => {
            if (data) {
                const ret = {}
                for (const e of data.entrylist) {
                    if (!(e.classcode in ret)) {
                        ret[e.classcode] = []
                    }
                    ret[e.classcode].push(e)
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
table {
    border-collapse: collapse;
    margin: auto;
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
}
</style>
