<template>
    <v-app>
        <v-app-bar app color="primary" dark>
            <div class="d-flex align-center">
                <v-img alt="Vuetify Logo" class="shrink mr-2" contain src="https://cdn.vuetifyjs.com/images/logos/vuetify-logo-dark.png" transition="scale-transition" width="40" />

                <v-img
                    alt="Vuetify Name"
                    class="shrink mt-1 hidden-sm-and-down"
                    contain
                    min-width="100"
                    src="https://cdn.vuetifyjs.com/images/logos/vuetify-name-dark.png"
                    width="100"
                />
            </div>

            <v-spacer></v-spacer>

            <v-btn href="https://github.com/vuetifyjs/vuetify/releases/latest" target="_blank" text>
                <span class="mr-2">Latest Release</span>
                <v-icon>mdi-open-in-new</v-icon>
            </v-btn>
        </v-app-bar>

        <v-main>
            {{serieslist}}
            <HelloWorld />
        </v-main>
    </v-app>
</template>

<script>
import Vue from 'vue'
import HelloWorld from './components/HelloWorld.vue'
// import { db } from '@scdb'

console.log(process)

export default Vue.extend({
    name: 'App',

    components: {
        HelloWorld
    },

    data: () => ({
        serieslist: []
    }),

    async mounted() {
        console.log('here4')
        console.log(window.pgpromise)


        this.serieslist = await window.pgpromise(
            {
                host: '127.0.0.1',
                port: '6432',
                database: 'scorekeeper',
                user: 'localuser',
                max: 30
            }
        ).any('SELECT * from mergeservers')
        console.log(this.serieslist)
    }
})
</script>
