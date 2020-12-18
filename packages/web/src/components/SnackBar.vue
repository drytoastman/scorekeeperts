<template>
    <v-snackbar :value="snackbar" :timeout="-1">
        <div class='snackerror'>
            <div v-for="(error, ii) in filteredErrors" :key="error+ii">{{ error }}</div>
        </div>
        <div v-if='filteredErrors.length && infos.length' class='snackdivider'></div>
        <div class='snackinfo'>
            <div v-for="(info, ii) in infos"   :key="info+ii">{{ info }}</div>
        </div>
        <template v-slot:action="{}">
            <v-btn text @click="snackclear">Clear</v-btn>
        </template>
    </v-snackbar>
</template>

<script>
import { mapState } from 'vuex'
export default {
    computed: {
        ...mapState(['errors', 'infos']),
        snackbar() { return this.filteredErrors.length > 0 || this.infos.length > 0 },
        filteredErrors() { return this.errors.filter(s => !['not authenticated', 'No driverid in session'].includes(s)) }
    },
    methods: {
        snackclear: function() {
            this.$store.commit('clearErrors')
            this.$store.commit('clearInfos')
        }
    }
}
</script>

<style lang="scss" scoped>
.snackinfo {
    color: lightgreen;
}
.snackdivider {
    margin: 0.5rem 0;
    border-top: 1px solid white;
}
.snackerror {
    color: red;
}
</style>
