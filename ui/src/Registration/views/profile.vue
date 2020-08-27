<template>
    <v-container v-if="driver.attr">
        <v-row dense>
            <v-col>
                <Driver :driver="driver" class='profilebox'>
                    <div class='dialogs'>
                        <v-btn dark color=secondary @click='driverDialog=true'>Edit Profile</v-btn>
                        <DriverDialog :driver="driver" apiType="update" v-model=driverDialog></DriverDialog>
                        <v-btn dark color=secondary @click='passwordDialog=true'>Change Password</v-btn>
                        <ChangePasswordDialog v-model=passwordDialog></ChangePasswordDialog>
                        <ConfirmDialog v-model=alreadyCreatedDialog title="Already Created" noCancel>
                            The provided registration token link was already loaded previously.  You can login normally from now on as the token will expire soon.
                        </ConfirmDialog>
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
import isEmpty from 'lodash/isEmpty'
import { mapGetters } from 'vuex'
import ConfirmDialog from '../../components/ConfirmDialog'
import Driver from '../../components/Driver'
import DriverDialog from '../../components/DriverDialog'
import ChangePasswordDialog from '../components/ChangePasswordDialog'
import EmailGroups from '../components/EmailGroups'
import EmailGroupsDialog from '../components/EmailGroupsDialog'
import SummaryDisplay from '../components/SummaryDisplay'

export default {
    name: 'Profile',
    components: {
        ConfirmDialog,
        ChangePasswordDialog,
        Driver,
        DriverDialog,
        EmailGroups,
        EmailGroupsDialog,
        SummaryDisplay
    },
    computed: {
        ...mapGetters(['driver']),
        loaded() { return this.mounted && !isEmpty(this.driver) }
    },
    data() {
        return {
            driverDialog: false,
            passwordDialog: false,
            alreadyCreatedDialog: false,
            mounted: false
        }
    },
    mounted() {
        this.mounted = true
    },
    watch: {
        loaded(newv) {
            if (newv && this.$store.state.tokenresult) {
                this.$nextTick(() => {
                    // have tokenresult, we're mounted, have driver and children should be mounted
                    switch (this.$store.state.tokenresult) {
                        case 'usernameexists':  this.alreadyCreatedDialog = true; break
                        case 'toprofileeditor': this.driverDialog = true; break
                    }
                    this.$store.commit('clearTokenResult')
                })
            }
        }
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
