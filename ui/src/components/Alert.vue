<template>
    <div v-if="error" class="alert">{{error}}</div>
</template>

<script>
export default {
    name: 'Alert',
    props: ['errors'],
    computed: {
        error: function () {
            if (this.errors === undefined) { return '' }
            if (typeof this.errors === 'string') { return this.errors }
            if (this.errors.length > 0) { return this.errors.join(',') }
            return ''
        }
    }
}
</script>

<style scoped>
.alert {
    padding: 2px 0px;
    color: red;
    text-align: center;
}
</style>
