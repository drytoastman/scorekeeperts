<template>
    <table>
        <tbody>
            <tr class='head'><th colspan='6'>Timer</th></tr>
            <tr><td class='timer'>{{timer.timer | t3}}</td></tr>
        </tbody>
    </table>
</template>

<script>
export default {
    name: 'TimerBox',
    props: {
        timer: Object
    }
}
</script>

<style lang="scss" scoped>
.timer {
    font-size: 300%;
    text-align: center;
}
</style>
