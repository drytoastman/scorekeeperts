<template>
    <div>
        {{emailresult}}
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
