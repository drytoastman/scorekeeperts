<template>
    <v-app fluid>
        <v-main>
            <router-view></router-view>
        </v-main>
        <SnackBar></SnackBar>
    </v-app>
</template>

<script>
import SnackBar from '@/components/SnackBar.vue'

export default {
    name: 'Live',
    components: {
        SnackBar
    },
    data: () => ({
    }),
    methods: {
    },
    computed: {
    },
    mounted() {
        this.$store.dispatch('restartWebSocket')
    }
}
</script>

<style lang="scss">
@import '@/styles/general.scss';

html, body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    font-size: 0.95rem;

    --headerfill: #29608e;
    --headercolor: white;
    --titlesfill: #4598dd;
    --titlescolor: white;
    --general-border-color: #a8a8a8;
    --could-have-background: #EDD;
    --could-have-color: #E77;
    --improved-on-background: #EEF;
    --improved-on-color: #99E;
    --highlight-background: #DDD;
    --paper-tabs-selection-bar-color: #ff5926;
    --paper-tab-ink: #000;
    --paper-font-subhead_-_font-size: 14px;
}
</style>
