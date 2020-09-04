<template>
    <div @mouseover="mouseover" @mouseleave="mouseleave">
        <router-link :to=to @click.native="linkclick">
            <slot></slot>
        </router-link>
    </div>
</template>

<script>
export default {
    props: {
        to: Object,
        variable: String
    },
    methods: {
        mouseover() {
            this.$store.state[this.variable] = true
        },
        mouseleave() {
            this.$store.state[this.variable] = false
        },
        linkclick() {
            this.$store.state[this.variable] = false
        }
    }
}
</script>

<style scoped>
</style>
