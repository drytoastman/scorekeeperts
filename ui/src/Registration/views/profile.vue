<template>
    <v-container v-if="driver.attr">
        <v-row dense>
            <v-col>
                <Driver :driver="driver" class='profilebox'>
                    <div class='dialogs'>
                        <DriverDialog :driver="driver"></DriverDialog>
                        <ChangePasswordDialog></ChangePasswordDialog>
                    </div>
                </Driver>
                <EmailGroups class='profilebox emailgroups' v-if="!driver.optoutmail">
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
import { mapGetters } from 'vuex'
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
        ...mapGetters(['driver'])
    }
}
</script>

<style>
.dialogs .v-btn--contained {
    margin-top: 15px;
    margin-left: 7px;
}
.dialogs .v-btn--contained:first-child {
    margin-left: 0px !important;
}
.emailgroups {
    margin-top: 8px;
}
</style>
