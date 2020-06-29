<template>
    <div class='placeholder'>
        Placeholder - {{$route.name}} {{$route.params}}
    </div>
</template>

<script>
export default {
    name: 'Placeholder'
}
</script>

<style scoped>
.placeholder {
    margin: 3rem;
    font-weight: bold;
}
</style>
