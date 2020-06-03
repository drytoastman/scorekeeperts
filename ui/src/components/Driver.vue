<template>
    <div v-if="driver && driver.attr">
        <div class='title'>{{driver.firstname}} {{driver.lastname}}</div>
        <div>{{driver.driverid}}</div>
        <div>
            {{driver.email}}
            <v-tooltip right>
                <template v-slot:activator="{ on }">
                    <v-icon class='dncicon' small :color="dnccolor" v-on="on">{{dncicon}}</v-icon>
                </template>
                <span>{{dnctooltip}}</span>
            </v-tooltip>
        </div>
        <div class='barcodescca'>
            <span class='barcode' v-if="driver.barcode"><b>Barcode:</b> {{driver.barcode}}</span>
            <span class='scca'    v-if="driver.attr.scca"><b>SCCA:</b> {{driver.attr.scca}}</span>
        </div>
        <div>{{driver.attr.phone}}</div>
        <div>{{driver.attr.address}}</div>
        <div class='csz'>{{driver.attr.city}} {{driver.attr.state}} {{driver.attr.zip}}</div>
        <div class='sponsorbrag'>
            <template v-if="driver.attr.sponsor"><span><b>Sponsor:</b></span><span>{{driver.attr.sponsor}}</span></template>
            <template v-if="driver.attr.brag"><span><b> Brag:</b></span><span>{{driver.attr.brag}}</span></template>
        </div>
        <div>
            <span v-if="driver.attr.econtact || driver.attr.ephone"><b>Emergency</b></span><br/>
            <span class='econtact' v-if="driver.attr.econtact"><b>Contact:</b> {{driver.attr.econtact}}</span><br/>
            <span class='ephone'   v-if="driver.attr.ephone"><b>Phone:</b> {{driver.attr.ephone}}</span>
        </div>
        <slot></slot>
    </div>
</template>

<script>
import { mdiEmail, mdiEmailOff } from '@mdi/js'

export default {
    name: 'Driver',
    props: {
        driver: Object
    },
    computed: {
        dncicon()  { return this.driver.optoutmail ? mdiEmailOff : mdiEmail },
        dnccolor() { return this.driver.optoutmail ? '#A77' : '#7A7' },
        dnctooltip() { return this.driver.optoutmail ? 'Do Not Contact' : 'Contact Ok' }
    }
}
</script>

<style scoped>
.dncicon {
    margin-left: 10px;
}
.econtact, .ephone {
    margin-left: 10px;
}
.barcodescca, .csz {
    padding-bottom: 8px;
    margin-bottom: 8px;
    border-bottom: 1px solid #CCC;
}
.barcode {
    margin-right: 10px;
}
.sponsorbrag {
    display: grid;
    grid-template-columns: auto auto;
    column-gap: 10px;
}
</style>
