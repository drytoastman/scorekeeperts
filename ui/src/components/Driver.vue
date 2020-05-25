<template>
    <v-container fluid v-if="driver.attr" class='driverinfo'>
        <v-row>id: {{driver.driverid}}</v-row>
        <v-row class='name'>{{driver.firstname}} {{driver.lastname}}</v-row>
        <v-row>
            {{driver.email}}
            <v-tooltip right>
                <template v-slot:activator="{ on }">
                    <v-icon class='dncicon' small :color="dnccolor" v-on="on">{{dncicon}}</v-icon>
                </template>
                <span>{{dnctooltip}}</span>
            </v-tooltip>
        </v-row>
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
import { mdiEmail, mdiEmailOff } from '@mdi/js'

export default {
    name: 'Driver',
    computed: {
        ...mapState(['driver']),
        dncicon()  { return this.driver.optoutmail ? mdiEmailOff : mdiEmail },
        dnccolor() { return this.driver.optoutmail ? '#A77' : '#7A7' },
        dnctooltip() { return this.driver.optoutmail ? 'Do Not Contact' : 'Contact Ok' }
    }
}
</script>

<style scoped>
.name {
    font-weight: bold;
    font-size: 110%;
}
.dncicon {
    margin-left: 10px;
}
</style>
