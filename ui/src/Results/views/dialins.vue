<template>
    <div>
        <div class='top'>
            <div class='title1'>{{resultsEvent.name}} - Dialins</div>
            <v-radio-group v-model="orderkey" dense label="Order By">
                <v-radio label="Net"        value="net"></v-radio>
                <v-radio label="Class Diff" value="prodiff"></v-radio>
            </v-radio-group>
        </div>

        <table class='dialins results'>
            <tr>
                <th>A</th>
                <th>O</th>
                <th>L</th>
                <th>Name</th>
                <th>Class</th>
                <th>Index</th>
                <th>Value</th>
                <th>Net</th>
                <th>ClsDiff</th>
                <th>Bonus</th>
                <th>Regular</th>
            </tr>

            <tr v-for="(e,idx) in entrants" :key="idx">
                <td>{{idx}}</td>
                <td>{{e.openindex}}</td>
                <td>{{e.ladiesindex}}</td>
                <td>{{e.firstname}} {{e.lastname}}</td>
                <td>{{e.classcode}}</td>
                <td>{{e.indexstr}}</td>
                <td class='t3'>{{e.indexval|t3}}</td>
                <td :class="'t3 ' + (orderkey==='net'     ? 'sort' : '')">{{e.net|t3}}</td>
                <td :class="'t3 ' + (orderkey==='prodiff' ? 'sort' : '')">{{e.prodiff|t3}}</td>
                <td class='t3'>{{e.bonusdial|t3}}</td>
                <td class='t3'>{{e.prodial|t3}}</td>
            </tr>
        </table>
    </div>
</template>

<script>
import orderBy from 'lodash/orderBy'
import { mapGetters, mapState } from 'vuex'

export default {
    name: 'Dialins',
    props: {
        eventid: String
    },
    data() {
        return {
            orderkey: 'net'
        }
    },
    computed: {
        ...mapGetters(['resultsEvent']),
        ...mapState(['eventresults']),
        entrants() {
            const ret = []
            let o = 1
            let l = 1

            for (const [classcode, classlist] of Object.entries(this.eventresults)) {
                if (classcode === '_eventid') continue
                ret.push(...classlist)
            }

            return orderBy(ret, this.orderkey).map(e => {
                if (e.classcode[0] === 'L') {
                    e.ladiesindex = l++
                } else {
                    e.openindex = o++
                }
                return e
            })
        }
    }
}
</script>

<style lang="scss" scoped>
.top {
    display: flex;
    column-gap: 1rem;
    align-items: center;
    justify-content: center;
    .title1 {
        color: var(--headerColor);
        font-size: 150%;
    }
    .v-input--selection-controls {
        margin-top: 0;
    }
}
.t3 {
    text-align: right;
}
@media print {
    .top, .dialins {
        font-size: 90%;
    }
    .v-input--radio-group {
        display: none;
    }
}
</style>
