<template>
    <v-app fluid>
        <v-app-bar app dark color="primary">
            <DocMenu :items="generalMenu" text="General"></DocMenu>
            <DocMenu :items="applicationsMenu" text="Applications"></DocMenu>
            <DocMenu :items="adminMenu" text="Website Admin"></DocMenu>
            <DocMenu :items="userMenu" text="Website User"></DocMenu>
        </v-app-bar>

        <v-main>
            <router-view/>
        </v-main>
    </v-app>
</template>

<script>
import DocMenu from './DocMenu.vue'
export default {
    name: 'Docs',
    components: {
        DocMenu
    },
    data() {
        return  {
            generalMenu: [
                { title: 'Recommended Setups',         page: 'recommend' },
                { title: 'Installation',               page: 'install' },
                { title: '',                           page: '' },
                { title: 'PT2730 Label Printer',       page: 'pt2730' },
                { title: 'Nadamoo Barcode Scanner',    page: 'nadamoo' },
                { title: 'Keyboard Barcode Scanners',  page: 'commonbarcodescanner' },
                { title: 'Running a ProSolo',          page: 'runningpro' }
            ],
            applicationsMenu: [
                { title: 'Starting the System',        page: 'starting' },
                { title: 'Syncing Databases',          page: 'sync' },
                { title: 'Backups And Debug Data',     page: 'backupdebug' },
                { title: '',                           page: '' },
                { title: 'Registration',               page: 'registration' },
                { title: 'DataEntry',                  page: 'dataentry' },
                { title: 'DataEntry - ProSolo',        page: 'dataentry-pro' },
                { title: 'ProTimer',                   page: 'protimer' },
                { title: 'Old Challenge GUI',          page: 'challenge' },
                { title: 'New Challenge GUI',          page: 'fxchallenge' }
            ],
            adminMenu: [
                // { title: 'Series Settings',            page: 'seriessettings' },
                { title: 'Setting Up Square/Paypal',   page: 'paymentaccounts' },
                { title: 'Adding External Results',    page: 'externalresults' },
                { title: 'Event Administration',       page: 'eventsettings' }
            ],
            userMenu: [
                { title: 'Onsite Results/Registation', page: 'onsite' }
            ]
        }
    }
}
</script>

<style lang="scss">
@import '@/styles/docs.scss';
</style>
