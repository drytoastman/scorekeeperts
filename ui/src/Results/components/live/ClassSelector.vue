<template>
    <div class='selector'>
        <div class='text'>Filter Class: </div>
        <v-select :items="classcodes" :value="value" @input="$emit('input', $event)" outlined dense hide-details></v-select>
    </div>
</template>

<script>
export default {
    name: 'ClassSelector',
    props: {
        value: {}
    },
    computed: {
        classcodes() {
            return [
                { text: 'All', value: '' },
                ...Object.values(this.$store.state.classes).map(c => c.classcode).filter(c => c !== 'HOLD').sort()
            ]
        }
    }
}
</script>

<style lang="scss" scoped>
.selector {
    display: flex;
    align-items: baseline;
    column-gap: 1rem;
    margin: 0.3rem;
    /*
    margin-top: 0.5rem;
    xmargin-left: 0.5rem;
    margin-right: 0.5rem; */
    .text {
        text-align: right;
        font-weight: bold;
        flex: 0.3;
    }
    .v-select {
        flex: 0.6;
    }
}
</style>
