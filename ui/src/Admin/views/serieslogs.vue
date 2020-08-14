<template>
    <div class='outer'>
        Log files
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
