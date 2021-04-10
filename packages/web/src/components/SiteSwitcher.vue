<template>
    <v-menu>
        <template v-slot:activator="{ on, attrs }">
            <v-btn dark icon v-bind="attrs" v-on="on" class='siteswitcher'>
                <v-img v-if=icon :src=icon max-height=40 max-width=40></v-img>
                <v-icon v-else>{{mdiApps}}</v-icon>
            </v-btn>
        </template>

        <v-card class='selector'>
            <ul>
                <li v-if="site!='Results'"> <a :href="surl('results')">Results</a></li>
                <li v-if="site!='Register'"><a :href="surl('register')">Register</a></li>
                <li v-if="site!='Admin'">   <a :href="surl('admin')">Admin</a></li>
            </ul>
        </v-card>
    </v-menu>
</template>

<script>
import { mdiApps } from '@mdi/js'

export default {
    name: 'SiteSwitcher',
    props: {
        site: String,
        icon: String
    },
    data() {
        return {
            mdiApps
        }
    },
    computed: {
        currentSeries() {
            return this.$store.state.currentSeries
        }
    },
    methods: {
        surl(root) {
            return `/${root}/${this.currentSeries}`
        }
    }
}
</script>

<style lang='scss' scoped>
.siteswitcher {
    height: auto !important;
    width: auto !important;
    margin-right: 5px;
}

.v-card.selector {
    ul {
        list-style: none;
        padding: 0.4rem 0;
        li {
            font-weight: bold;
            font-size: 110%;
            padding: 0.4rem 0.8rem;
            a {
                text-decoration: none;
            }
            &:hover {
                background: lightgrey;
            }
        }
    }
}
</style>
