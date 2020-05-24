<template>
    <div>
        <Driver></Driver>
        <EmailGroups></EmailGroups>
        <DriverDialog :driver="driver"></DriverDialog>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import Driver from '../../components/Driver'
import DriverDialog from '../../components/DriverDialog'
import EmailGroups from '../components/EmailGroups'

export default {
    name: 'Profile',
    components: {
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
</style>
