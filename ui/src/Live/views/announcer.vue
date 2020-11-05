<template>
    <div class='outer'>
        Announcer
        <!-- <v-btn dark class='flexbutton' color="secondary">Add Car</v-btn> -->
    </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
    components: {
    },
    data() {
        return {
        }
    },
    computed: {
        ...mapState(['series', 'cars', 'errors'])
    },
    methods: {
    }
}
</script>

<style scoped lang='scss'>
</style>
