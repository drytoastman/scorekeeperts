<template>
    <div>
        <div class='stitle'>Audit (by {{order}})</div>
        <div class='text-center'>
            <div class='col'>
                Course:
                <template v-for="c in event.courses">
                    <span :key="c" v-if="c == course" class='bold'>{{c}}</span>
                    <router-link v-else :key="c+100" :to="{name: 'audit', params: { eventslug: eventslug }, query: { order: order, course: c+'', group: group }}">
                        {{c}}
                    </router-link>
                </template>
            </div>
            <div class='col'>
                Group:
                <template v-for="g in 6">
                <span :key="g" v-if="g == group" class='bold'>{{g}}</span>
                <router-link v-else :key="g+100" :to="{name: 'audit', params: { eventslug: eventslug }, query: { order: order, course: course, group: g+'' }}">
                    {{g}}
                </router-link>
                </template>
            </div>

        </div>
        <div class='text-center' v-if="audit.length === 0"> No entrants to display yet </div>
        <AuditTable v-else :audit="audit" :course="parseInt(course)" :order="order"></AuditTable>
    </div>
</template>

<script>
import orderBy from 'lodash/orderBy'
import flatten from 'lodash/flatten'
import { mapState, mapGetters } from 'vuex'

import AuditTable from '../components/standard/AuditTable.vue'

export default {
    name: 'AuditDisplay',
    components: {
        AuditTable
    },
    props: {
        course: String,
        group: String,
        order:  String,
        eventslug: String
    },
    data() {
        return {
            runorder: undefined
        }
    },
    computed: {
        ...mapState(['eventresults']),
        ...mapGetters(['eventInfo']),
        event()    { return this.eventInfo(this.eventslug) },
        anyparam() { return [this.course, this.group] },
        audit() {
            const rungroup = parseInt(this.group)
            const ret = flatten(Object.values(this.eventresults)).filter(e => e.rungroup === rungroup)
            if (this.order === 'runorder') {
                if (!this.runorder) return []
                return orderBy(ret, e => this.runorder.indexOf(e.carid))
            }
            return orderBy(ret, e => e[this.order].toLowerCase())
        }
    },
    methods: {
        loadRunOrder() {
            this.$store.dispatch('getdata', { items: 'runorder', eventid: this.eventslug, course: this.course, rungroup: this.group }).then(res => {
                if (res) this.runorder = res.runorder
            })
        }
    },
    watch: {
        anyparam() {
            this.runorder = undefined
            this.loadRunOrder()
        }
    },
    mounted() {
        this.loadRunOrder()
    }
}
</script>

<style lang="scss" scoped>
.stitle {
    text-align: center;
    color: var(--headerColor);
    font-size: 140%;
    font-weight: bold;
    margin-bottom: 0.5rem;
}
.col {
    display: inline-block;
    max-width: 15rem;
    a, span {
        min-width: 1rem;
        display: inline-block;
        text-decoration: none;
    }
}
.bold {
    font-weight: bold;
}
.auditreport {
    margin: auto;
}
</style>
