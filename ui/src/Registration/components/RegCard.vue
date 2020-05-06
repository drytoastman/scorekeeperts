<template>
    <v-card class='regcard' outlined :disabled='reg.busy' :loading='reg.busy'>
        <v-card-title>
            <CarLabel :car=car fontsize="85%"></CarLabel>
        </v-card-title>
        <v-card-text>
            <div v-if="reg.session">
                Session: {{reg.session}}
            </div>
            <div v-for="p in payments" :key="p.payid">
                ${{p.amount}} ({{p.txtype}})
            </div>
            <div v-if="wrap.isOpen() && wrap.event.attr.paymentreq && !payments.length" class='paymentreq'>
                Payment Required
            </div>
        </v-card-text>
        <v-card-actions v-if="wrap.isOpen()">
            <v-btn class="flex-grow-1" color="info" @click="deleteReg()"><v-icon>mdi-close-box-outline</v-icon></v-btn>
            <v-btn class="flex-grow-1" color="info" @click="doPayment()" v-if="wrap.event.accountid"><v-icon>mdi-cash-plus</v-icon></v-btn>
        </v-card-actions>
    </v-card>
</template>

<script>
import { mapState } from 'vuex'
import Vue from 'vue'
import { EventWrap, Registration, Payment } from '@common/lib'
import CarLabel from '../../components/CarLabel'

export default {
    components: { CarLabel },
    props: {
        wrap: EventWrap,
        car: Object,
        reg: Registration,
        payments: Payment
    },
    computed: {
        ...mapState(['series'])
    },
    methods: {
        deleteReg() {
            // Called when the ok action in the dialog is taken
            this.$store.dispatch('setdata', {
                series: this.series,
                type: 'delete',
                registered: [this.reg]
            })
            Vue.set(this.reg, 'busy', true)
        }
    }
}
</script>

<style scoped>
    /*
    .v-card--disabled > :not(.v-card__progress) {
        opacity: 0.3;
    } */
    .paymentreq {
        color: red;
    }
</style>
