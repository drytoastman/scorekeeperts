<template>
    <v-card class='regcard' outlined :disabled='car.busy' :loading='car.busy'>
        <v-card-title>
            <CarLabel :car=car></CarLabel>
        </v-card-title>
        <v-card-text>
        <div v-if="reg.session">
            Session: {{reg.session}}
        </div>
        <div v-for="p in payments" :key="p.payid">
            {{p.txtype}} {{p.amount}}
        </div>
        </v-card-text>
    </v-card>
</template>

<script>
import { Registration, Payment } from '@common/lib'
import CarLabel from '../../components/CarLabel'

export default {
    components: { CarLabel },
    props: {
        car: Object,
        reg: Registration,
        payments: Payment
    }
}
</script>

<style scoped>
    .v-card--disabled > :not(.v-card__progress) {
        opacity: 0.3;
    }
</style>
