<template>
    <div>
        <div v-for="key in Object.keys(emailresult)" :key="key">
            {{key}}: {{emailresult[key]}}
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
    name: 'EmailResult',
    components: {
    },
    computed: {
        ...mapState(['emailresult'])
    }
}
</script>

<style scoped>
</style>
