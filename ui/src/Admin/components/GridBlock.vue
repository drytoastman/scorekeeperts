<template>
    <div :class='classtype'>
        <span>{{obj.classcode}}</span>
        <span>{{obj.firsts}}</span>
        <span>{{obj.seconds}}</span>
    </div>
</template>

<script>
export default {
    name: 'GridBlock',
    props: {
        obj: Object
    },
    data() {
        return {
        }
    },
    computed: {
        classtype() { return `element ${this.obj.changed ? 'changed' : ''}` }
    }
}
</script>

<style scoped lang="scss">
.element {
    font-size: 90%;
    border: 1px solid grey;
    border-radius: 5px;
    background: #EEEA;
    color: #333;
    margin: 0.5rem;
    padding: 0.5rem 1rem;
    display: grid;
    grid-template-columns: 4fr 3fr 2fr;
    justify-items: right;
}
.changed {
    background: yellow;
}
</style>
