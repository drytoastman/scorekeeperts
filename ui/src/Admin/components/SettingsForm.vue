<template>
    <div class='outer'>
    <div class='adminbuttons3'>
        <v-btn color="secondary" :disabled="unchanged" @click="reset">Reset</v-btn>
        <v-btn color="secondary" :disabled="unchanged" @click="saveSettings">Save</v-btn>
        <v-btn color="secondary" outlined @click="changePassword">Change Password</v-btn>
    </div>

    <v-form class='settingsform'>
        <v-text-field v-model="settingsm.seriesname"       style="grid-area: name"   :rules="vrules.seriesname" label="Series Name"></v-text-field>

        <v-text-field v-model="settingsm.emaillistid"      style="grid-area: listid" :rules="vrules.emaillistid" label="Email List Id"></v-text-field>
        <v-text-field v-model="settingsm.largestcarnumber" style="grid-area: largen" :rules="vrules.largestcarnumber" label="Largest Car Number"></v-text-field>
        <v-text-field v-model="settingsm.minevents"        style="grid-area: mevent" :rules="vrules.minevents" label="Minimum Events For Championship"></v-text-field>
        <v-text-field v-model="settingsm.dropevents"       style="grid-area: devent" :rules="vrules.dropevents" label="Events Dropped For Championship"></v-text-field>
        <v-text-field v-model="settingsm.classinglink"     style="grid-area: linkc"  :rules="vrules.classinglink" label="Classing Help Link"></v-text-field>

        <v-checkbox v-model="settingsm.requestrulesack"    style="grid-area: reqr"   :rules="vrules.requestrulesack" label="Request Rules Ack"></v-checkbox>
        <v-text-field v-model="settingsm.seriesruleslink"  style="grid-area: linkr"  :rules="vrules.seriesruleslink" label="Series Rules Link"></v-text-field>

        <v-checkbox v-model="settingsm.usepospoints"        style="grid-area: usepos" :rules="vrules.usepospoints" label="Use Position Based Points"></v-checkbox>
        <v-text-field :disabled="!settingsm.usepospoints"
            v-model="settingsm.pospointlist" style="grid-area: ppoints" :rules="vrules.pospointlist" label="Position Points List">
        </v-text-field>

        <v-checkbox v-model="settingsm.requestmembership"   style="grid-area: reqmem" label="Request Membership"></v-checkbox>
        <v-select v-model="settingsm.membershipitem"        style="grid-area: memitm" :items="memberitems"    item-value="itemid"    item-text="name"></v-select>
        <v-select v-model="settingsm.membershipaccount"     style="grid-area: memact" :items="memberaccounts" item-value="accountid" item-text="name"></v-select>

        <v-checkbox v-model="settingsm.requestbarcodes"     style="grid-area: reqb"   :rules="vrules.requestbarcodes" label="Request Barcodes"></v-checkbox>
        <v-checkbox v-model="settingsm.indexafterpenalties" style="grid-area: indexa" :rules="vrules.indexafterpenalties" label="Index After Penalties"></v-checkbox>
        <v-checkbox v-model="settingsm.superuniquenumbers"  style="grid-area: superu" :rules="vrules.superuniquenumbers" label="Series Wide Unique Numbers"></v-checkbox>

        <v-expansion-panels multiple focusable hover accordion style="grid-area: temp; margin-bottom: 1rem">
            <v-expansion-panel>
                <v-expansion-panel-header>Results Extra CSS</v-expansion-panel-header>
                <v-expansion-panel-content><PrismEditor :highlight="css" v-model="settingsm.resultscss"></PrismEditor></v-expansion-panel-content>
            </v-expansion-panel>
            <v-expansion-panel>
                <v-expansion-panel-header>Results Header (HTML)</v-expansion-panel-header>
                <v-expansion-panel-content><PrismEditor :highlight="html" v-model="settingsm.resultsheader"></PrismEditor></v-expansion-panel-content>
            </v-expansion-panel>
            <v-expansion-panel>
                <v-expansion-panel-header>Card Template (HTML)</v-expansion-panel-header>
                <v-expansion-panel-content><PrismEditor :highlight="html" v-model="settingsm.cardtemplate"></PrismEditor></v-expansion-panel-content>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-form>
    </div>
</template>

<script>
import isEqualWith from 'lodash/isEqualWith'
import { mapState } from 'vuex'
import { PrismEditor } from 'vue-prism-editor'
import { prismlangs } from '@/util/prismwrapper'
import { SettingsValidator } from '@/common/settings'
import { ITEM_TYPE_SERIES_FEE } from '../../../../server/src/common/payments'

export default {
    name: 'SettingsForm',
    components: {
        PrismEditor
    },
    data() {
        return {
            settingsm: {},
            vrules: SettingsValidator,
            showedit1: false
        }
    },
    computed: {
        ...mapState(['settings', 'paymentaccounts', 'paymentitems']),
        memberitems()    { return Object.values(this.paymentitems).filter(i => i.itemtype === ITEM_TYPE_SERIES_FEE) },
        memberaccounts() { return Object.values(this.paymentaccounts) },
        unchanged() {
            return isEqualWith(this.settings, this.settingsm, (objv, othv) => {
                if ((typeof objv === 'string') && (typeof othv === 'string')) {
                    if (objv.trim() === othv.trim()) { return true }
                }
            })
        }
    },
    methods: {
        ...prismlangs,
        changePassword() {
            console.log('change')
        },
        saveSettings() {
            this.$store.commit('gettingData', true)
            this.$store.dispatch('setdata', {
                type: 'update',
                items: { settings: this.settingsm }
            }).then(() => this.$store.commit('gettingData', false))
        },
        reset() {
            this.settingsm = Object.assign({}, this.settings)
            for (const template of ['resultscss', 'resultsheader', 'cardtemplate']) {
                this.settingsm[template] = this.settingsm[template] || '\n'
            }
        }
    },
    watch: { settings() { this.reset() } },
    mounted() { this.reset() }
}
</script>

<style scoped>
.settingsform {
    display: grid;
    column-gap: 2rem;
    grid-template-columns: repeat(6, 1fr);
    grid-template-areas:
        "name name name name listid listid "
        "largen largen mevent mevent devent devent "
        "linkc linkc linkc linkc linkc linkc "
        "reqmem reqmem memitm memitm memact memact "
        "reqr reqr linkr linkr linkr linkr "
        "usepos usepos ppoints ppoints ppoints ppoints "
        "reqb reqb indexa indexa superu superu "
        "temp temp temp temp temp temp "
    ;
}

.settingsform >>> .v-input--selection-controls__input {
    align-self: baseline;
}
.settingsform >>> .v-expansion-panel-content__wrap {
    padding-top: 1rem;
}
</style>
