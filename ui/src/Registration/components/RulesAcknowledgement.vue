<template>
    <v-dialog :value="value" @input="$emit('input')" persistent maxWidth="500px">
        <v-card>
            <v-card-title>
                <span class="headline primary--text">Series Rules and Regulations</span>
            </v-card-title>
            <v-card-text class='body'>
                The {{currentSeries}} admin requests that you have read and accepted the
                <a :href="settings.seriesruleslink" target="helptab" @click="opened=true">rules and regulations for the series</a>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" text @click="$emit('input')">Cancel</v-btn>
                <v-btn color="primary" :disabled="!opened" text @click="$emit('ok'); $emit('input')">Accept Rules</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import { mapState } from 'vuex'

export default {
    props: {
        value: Boolean
    },
    data() {
        return {
            opened: false
        }
    },
    computed: {
        ...mapState(['currentSeries', 'settings'])
    }
}
</script>

<style scoped lang="scss">
.body {
    padding: 1rem !important;
    text-align: center;
    a {
        color: blue;
    }
}
</style>
