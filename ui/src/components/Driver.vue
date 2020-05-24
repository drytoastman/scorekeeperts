<template>
    <v-container fluid>
        <v-row>id: {{driver.driverid}}</v-row>
        <v-row>{{driver.firstname}} {{driver.lastname}}</v-row>
        <v-row>{{driver.email}} {{driver.optoutmail}}</v-row>
        <v-row>Barcode: {{driver.barcode}} SCCA: {{driver.attr.scca}}</v-row>
        <v-row>{{driver.attr.phone}}</v-row>
        <v-row>{{driver.attr.address}}</v-row>
        <v-row>{{driver.attr.city}} {{driver.attr.state}} {{driver.attr.zip}}</v-row>
        <v-row>{{driver.attr.econtact}} {{driver.attr.ephone}}</v-row>
        <v-row>{{driver.attr.sponsor}}</v-row>
        <v-row>{{driver.attr.brag}}</v-row>
    </v-container>
</template>

<script>
import { mapState } from 'vuex'

export default {
    name: 'Driver',
    computed: {
        ...mapState(['driver'])
    }
}
</script>

<style scoped>
</style>
