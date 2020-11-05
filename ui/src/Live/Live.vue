<template>
    <v-app fluid>
        <v-main>
            <router-view></router-view>
        </v-main>
    </v-app>
</template>

<script>
export default {
    name: 'Live',
    components: {
    },
    data: () => ({
    }),
    methods: {
    },
    computed: {
    }
}
</script>

<style lang="scss">
@import '@/styles/general.scss';
@import '@/styles/live.scss';
</style>
