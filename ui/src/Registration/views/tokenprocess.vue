<template>
    <div class='outer'>
        <h2>Processing Token ...</h2>
        {{status}}
    </div>
</template>

<script>
export default {
    name: 'TokenProcess',
    data() {
        return {
            status: ''
        }
    },
    components: {
    },
    computed: {
    },
    mounted() {
        this.$store.dispatch('token', { token: this.$route.query.t, signature: this.$route.query.s }).then(data => {
            this.status = data
        })
    }
}
</script>

<style scoped>
.outer {
    padding: 2rem;
}
</style>
