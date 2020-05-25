<template>
    <v-container>
        <Driver></Driver>
        <EmailGroups></EmailGroups>
        <DriverDialog :driver="driver"></DriverDialog>
        <ChangePasswordDialog></ChangePasswordDialog>
    </v-container>
</template>

<script>
import { mapState } from 'vuex'
import Driver from '../../components/Driver'
import DriverDialog from '../../components/DriverDialog'
import ChangePasswordDialog from '../components/ChangePasswordDialog'
import EmailGroups from '../components/EmailGroups'

export default {
    name: 'Profile',
    components: {
        ChangePasswordDialog,
        Driver,
        DriverDialog,
        EmailGroups
    },
    computed: {
        ...mapState(['driver'])
    }
}
</script>

<style scoped>
.driverinfo {
    margin-left: 1rem;
}
</style>
