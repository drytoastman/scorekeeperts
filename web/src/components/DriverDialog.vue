<template>
    <BaseDialog :value="value" :apiType="apiType" dataType="Driver" width="420px" @input="$emit('input')" @update="update" ref="dialog">
        <div class='formgrid'>
            <v-text-field v-model="driverm.firstname"     class='firstn'   label="Firstname"         :rules="vrules.firstname"></v-text-field>
            <v-text-field v-model="driverm.lastname"      class='lastn'    label="Firstname"         :rules="vrules.lastname"></v-text-field>
            <v-text-field v-model="driverm.email"         class='email'    label="Email"             :rules="vrules.email"></v-text-field>
            <v-checkbox   v-model="driverm.optoutmail"    class='dnc'      label="Do Not Contact"></v-checkbox>
            <v-text-field v-model="driverm.barcode"       class='barcode'  label="Barcode"           :rules="vrules.barcode"></v-text-field>
            <v-text-field v-model="driverm.attr.scca"     class='scca'     label="SCCA #"            :rules="vrules.scca"></v-text-field>
            <v-divider class='divider'></v-divider>
            <v-text-field v-model="driverm.attr.address"  class='address'  label="Address"           :rules="vrules.address"></v-text-field>
            <v-text-field v-model="driverm.attr.city"     class='city'     label="City"              :rules="vrules.city"></v-text-field>
            <v-text-field v-model="driverm.attr.state"    class='state'    label="State"             :rules="vrules.state"></v-text-field>
            <v-text-field v-model="driverm.attr.zip"      class='zip'      label="Zip"               :rules="vrules.zip"></v-text-field>
            <v-text-field v-model="driverm.attr.phone"    class='phone'    label="Phone"             :rules="vrules.phone"></v-text-field>
            <v-text-field v-model="driverm.attr.brag"     class='brag'     label="Brag"              :rules="vrules.brag"></v-text-field>
            <v-text-field v-model="driverm.attr.sponsor"  class='sponsor'  label="Sponsor"           :rules="vrules.sponsor"></v-text-field>
            <v-text-field v-model="driverm.attr.econtact" class='econtact' label="Emergency Contact" :rules="vrules.econtact"></v-text-field>
            <v-text-field v-model="driverm.attr.ephone"   class='ephone'   label="Emergency Phone"   :rules="vrules.ephone"></v-text-field>
        </div>
    </BaseDialog>
</template>

<script>
import { DriverValidator } from '@sctypes/driver'
import BaseDialog from './BaseDialog'

export default {
    components: {
        BaseDialog
    },
    props: {
        value: Boolean,
        driver: Object,
        apiType: String
    },
    data() {
        return {
            vrules: DriverValidator,
            driverm: { attr: {}}
        }
    },
    methods: {
        update() {
            if (this.apiType === 'delete' || this.$refs.dialog.validate()) {
                this.$store.dispatch('setdata', {
                    type: this.apiType,
                    items: { drivers: [this.driverm] },
                    busy: { key: 'busyDriver', id: this.driver.driverid }
                }).then(() =>
                    this.$emit('complete', this.apiType, this.driverm)
                )
                this.$emit('save', this.driverm)
                this.$emit('input')
            }
        }
    },
    watch: {
        value: function(newv) {
            if (newv) { // dialog open
                this.$refs.dialog.resetValidation() // reset validations if present
                this.driverm = JSON.parse(JSON.stringify(this.driver || { attr: {}}))
            }
        }
    }
}
</script>

<style scoped>
.v-text-field {
    margin-top: 0;
}
.v-input--selection-controls {
    margin-top: 0;
}
.v-card__text {
    margin-top: 10px;
}

.formgrid {
    display: grid;
    column-gap: 10px;
    grid-template-columns: repeat(4, 1fr);
    grid-template-areas:
        "firstn firstn lastn lastn "
        "email email email dnc "
        "barcode barcode scca scca "
        "divider divider divider divider "
        "phone phone address address "
        "city city state zip "
        "econtact econtact ephone ephone "
        "sponsor sponsor sponsor sponsor "
        "brag brag brag brag "
        ;
}
.firstn   { grid-area: firstn; }
.lastn    { grid-area: lastn; }
.email    { grid-area: email; }
.dnc      { grid-area: dnc;  }
.barcode  { grid-area: barcode; }
.scca     { grid-area: scca; }
.divider  { grid-area: divider; }
.address  { grid-area: address; }
.city     { grid-area: city; }
.state    { grid-area: state; }
.zip      { grid-area: zip; }
.phone    { grid-area: phone; }
.brag     { grid-area: brag; }
.sponsor  { grid-area: sponsor; }
.econtact { grid-area: econtact; }
.ephone   { grid-area: ephone; }

.dnc .v-label {
    font-size: 80%;
}
.divider {
    border-style: dotted;
}
</style>
