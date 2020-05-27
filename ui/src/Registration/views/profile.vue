<template>
    <v-container v-if="driver.attr">
        <v-row dense>
            <v-col>
                <Driver class='profilebox'>
                    <div class='dialogs'>
                        <DriverDialog :driver="driver"></DriverDialog>
                        <ChangePasswordDialog></ChangePasswordDialog>
                    </div>
                </Driver>
            </v-col>
            <v-col>
                <EmailGroups v-if="!driver.optoutmail" class='profilebox'>
                    <div class='dialogs'>
                        <EmailGroupsDialog></EmailGroupsDialog>
                    </div>
                </EmailGroups>
            </v-col>
            <v-col>
                <SummaryDisplay class='profilebox'></SummaryDisplay>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import { mapState } from 'vuex'
import Driver from '../../components/Driver'
import DriverDialog from '../../components/DriverDialog'
import ChangePasswordDialog from '../components/ChangePasswordDialog'
import EmailGroups from '../components/EmailGroups'
import EmailGroupsDialog from '../components/EmailGroupsDialog'
import SummaryDisplay from '../components/SummaryDisplay'

export default {
    name: 'Profile',
    components: {
        ChangePasswordDialog,
        Driver,
        DriverDialog,
        EmailGroups,
        EmailGroupsDialog,
        SummaryDisplay
    },
    computed: {
        ...mapState(['driver'])
    }
}
</script>

<style>
.dialogs .v-btn--contained {
    margin-top: 10px;
    margin-left: 7px;
}
.dialogs .v-btn--contained:first-child {
    margin-left: 0px !important;
}
</style>
