<template>
    <SettingsForm></SettingsForm>
</template>

<script>
import SettingsForm from '../components/SettingsForm.vue'
export default {
    name: 'Settings',
    components: {
        SettingsForm
    }
}
</script>

<style scoped>
.settingsform {
    margin: 2rem;
}
</style>
