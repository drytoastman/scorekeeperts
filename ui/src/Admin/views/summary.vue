<template>
    <div class='outer'>
        <div v-if="series">
            Series Summary {{series}}
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
.outer {
    margin: 3rem;
    font-weight: bold;
}
</style>
