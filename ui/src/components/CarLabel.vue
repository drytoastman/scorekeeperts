<template>
    <div class='carlabel'>
        <div class='head'>
            <span class='code'>{{car.classcode}}</span>
            <span class='number'>#{{car.number}}</span>
            <span class='index'>{{indexstr}}</span>
        </div>
        <div class='descrip'>
            {{car.attr.year}} {{car.attr.make}} {{car.attr.model}} {{car.attr.color}}
        </div>
    </div>
</template>

<script>
export default {
    props: {
        car: {
            type: Object,
            default: () => ({ attr: {} })
        }
    },
    computed: {
        indexstr() { return (this.car.indexcode !== '') ? `(${this.car.indexcode})` : '' }
    }
}
</script>

<style scoped>
    .carlabel {
        font-weight: normal;
        line-height: 20px;
    }
    .code, .number, .index {
        vertical-align: middle;
        font-weight: 500;
    }
    .code {
        font-size: 1.4rem;
        color: #095675;
        margin-right: 4px;
    }
    .number {
        font-size: 1.2rem;
        margin-right: 6px;
    }
    .index {
        font-size: 1.0rem;
        color: grey;
    }
    .descrip {
        color: gray;
        font-size: 0.9rem;
    }
</style>
