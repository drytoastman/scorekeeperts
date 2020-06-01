<template>
    <div>
       {{paymentaccounts}}
    </div>
</template>

<script>
import _ from 'lodash'
import { mapState } from 'vuex'

export default {
    name: 'Accounts',
    computed: {
        ...mapState(['paymentaccounts'])
    },
    mounted() {
        if (_.isEmpty(this.paymentaccounts)) {
            this.$store.dispatch('getdata', { items: 'paymentaccounts' })
            // console.log('accounts mounted')
        }
    }
}
</script>

<style scoped>
</style>
