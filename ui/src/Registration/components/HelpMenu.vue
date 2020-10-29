<template>
    <v-menu offset-y>
        <template v-slot:activator="{ on, attrs }">
            <v-btn icon v-bind="attrs" v-on="on" :class="btnclass">
                <v-icon class='help'>{{mdiHelpCircle}}</v-icon>
            </v-btn>
        </template>
        <v-list>
            <v-list-item><router-link :to="'help'">General Help</router-link></v-list-item>
            <v-list-item v-if="settings.seriesruleslink"><a :href="settings.seriesruleslink" target="helptab">Series Rules</a></v-list-item>
            <v-list-item v-if="settings.classinglink">   <a :href="settings.classinglink"    target="helptab">Classing Help</a></v-list-item>
        </v-list>
    </v-menu>
</template>

<script>
import { mdiHelpCircle } from '@mdi/js'
import { mapState } from 'vuex'

export default {
    name: 'HelpMenu',
    props: {
        btnclass: String
    },
    computed: {
        ...mapState(['settings'])
    },
    data: () => ({
        mdiHelpCircle
    })
}
</script>

<style lang="scss" scoped>
::v-deep a {
    text-decoration: none;
}
</style>
