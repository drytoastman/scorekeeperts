<template>
    <div class='inset'>
        <div v-if="series">
            <h2>{{series}}</h2>
            <div v-for="e in Object.values(this.$store.state.events)" :key="e.eventid">
                <span class='date'>{{e.date|dmdy}}</span> {{e.name}}
            </div>
        </div>
        <div v-else>
            Select a series above...
        </div>
    </div>
</template>

<script>
export default {
    name: 'Summary',
    props: {
        series: String
    }
}
</script>

<style scoped>
.date {
    display: inline-block;
    width: 8rem;
    margin-left: 1rem;
    margin-right: 1rem;
    text-align: right;
}
</style>
