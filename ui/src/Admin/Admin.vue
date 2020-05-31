<template>
    <v-app fluid>
        <v-app-bar app dark color='primary'>
            <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
            <v-toolbar-title>Scorekeeper Admin</v-toolbar-title>
        </v-app-bar>

        <v-content>
            <Alert :errors=errors></Alert>
            admin stuff here someday
            <router-view />
        </v-content>
    </v-app>
</template>

<script>
// import { mapState } from 'vuex'
import Alert from '../components/Alert'

export default {
    name: 'App',
    components: {
        Alert
    },
    props: {
        source: String
    },
    data: () => ({
        drawer: null
    }),
    methods: {

    },
    computed: {
    },
    watch: {
    }
}
</script>

<style>
</style>
