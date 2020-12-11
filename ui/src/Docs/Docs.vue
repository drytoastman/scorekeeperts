<template>
    <v-app fluid>
        <v-app-bar dark color="primary">
            <v-img :src=cone max-height=40 max-width=40></v-img>
            <div class='header'>Scorekeeper Docs</div>
            <div class='menus'>
                <DocMenu :items="generalMenu" text="General"></DocMenu>
                <DocMenu :items="applicationsMenu" text="Applications"></DocMenu>
                <DocMenu :items="adminMenu" text="Website Admin"></DocMenu>
                <DocMenu :items="userMenu" text="Website User"></DocMenu>
            </div>
        </v-app-bar>

        <v-main>
            <router-view/>
        </v-main>
    </v-app>
</template>

<script>
import DocMenu from './DocMenu.vue'
import cone from '@/../public/images/cone.png'
export default {
    name: 'Docs',
    components: {
        DocMenu
    },
    data() {
        return  {
            cone,
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
                { title: 'Create a New Series',        page: 'createseries' },
                { title: 'Series Settings',            page: 'seriessettings' },
                { title: 'Payment Accounts/Items',     page: 'paymentaccounts' },
                { title: 'Create Events',              page: 'createevents' },
                { title: '',                           page: '' },
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

<style lang="scss" scoped>
.header {
    margin-left: 1rem;
    margin-right: 1rem;
}

.menus {
    display: flex;
    justify-content: space-evenly;
    flex-grow: 1;
    column-gap: 2px;
    z-index: 100;
    ::v-deep .v-btn {
        padding: 0 !important;
    }
}

.v-sheet.v-app-bar {
    height: initial !important;
    flex-grow: 0;
}

::v-deep .v-toolbar__content {
    flex-wrap: wrap;
    height: initial !important;
}
</style>

<style lang="scss">
@import '@/styles/docs.scss';
</style>
