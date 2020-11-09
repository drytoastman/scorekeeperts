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
    }
}
</script>

<style lang="scss">
@import '@/styles/live.scss';
</style>
